import ApiError from "../utils/ApiError.js";
import Conversation from "../models/Conversation.js";
import Listing from "../models/Listing.js";
import Message from "../models/Message.js";

export async function ensureListingExists(listingId) {
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new ApiError(404, "Listing not found.");
  }

  return listing;
}

export async function startConversationForListing({ listingId, currentUserId }) {
  const listing = await ensureListingExists(listingId);

  if (String(listing.seller) === String(currentUserId)) {
    throw new ApiError(400, "You cannot start a conversation on your own listing.");
  }

  const existingConversation = await Conversation.findOne({
    product: listing._id,
    buyer: currentUserId,
  }).populate("product buyer seller participants", "-password -savedListings");

  if (existingConversation) {
    return existingConversation;
  }

  const conversation = await Conversation.create({
    product: listing._id,
    buyer: currentUserId,
    seller: listing.seller,
    participants: [currentUserId, listing.seller],
    unreadCounts: {
      buyer: 0,
      seller: 0,
    },
  });

  return Conversation.findById(conversation._id).populate(
    "product buyer seller participants",
    "-password -savedListings",
  );
}

export async function ensureConversationParticipant({ conversationId, userId }) {
  const conversation = await Conversation.findById(conversationId)
    .populate("product", "title price images location status seller")
    .populate("buyer seller participants", "-password -savedListings");

  if (!conversation) {
    throw new ApiError(404, "Conversation not found.");
  }

  const isParticipant = conversation.participants.some(
    (participant) => String(participant._id) === String(userId),
  );

  if (!isParticipant) {
    throw new ApiError(403, "You do not have access to this conversation.");
  }

  return conversation;
}

export async function createMessage({ conversation, senderId, text }) {
  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    text,
    readBy: [senderId],
  });

  const senderIsSeller =
    String(senderId) === String(conversation.seller._id ?? conversation.seller);

  conversation.lastMessage = text;
  conversation.lastSender = senderId;
  conversation.lastMessageAt = message.createdAt;
  conversation.updatedAt = message.updatedAt;
  conversation.unreadCounts = {
    buyer: senderIsSeller ? (conversation.unreadCounts?.buyer ?? 0) + 1 : 0,
    seller: senderIsSeller ? 0 : (conversation.unreadCounts?.seller ?? 0) + 1,
  };

  await conversation.save();

  return message.populate("sender", "name email avatar phone university");
}

export async function markConversationAsRead({ conversation, userId }) {
  const isBuyer = String(conversation.buyer._id ?? conversation.buyer) === String(userId);
  const unreadKey = isBuyer ? "buyer" : "seller";

  await Message.updateMany(
    {
      conversation: conversation._id,
      readBy: { $ne: userId },
    },
    {
      $addToSet: { readBy: userId },
    },
  );

  conversation.unreadCounts[unreadKey] = 0;
  await conversation.save();

  return conversation;
}