import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

function getId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value._id ?? value.id ?? value);
}

function getName(value, fallback) {
  return value?.name ?? fallback;
}

export function getConversationRoomName(conversationId) {
  return `conversation:${conversationId}`;
}

export async function hydrateConversation(conversationId) {
  return Conversation.findById(conversationId)
    .populate({
      path: "product",
      select: "title price images image location status seller category description createdAt updatedAt",
      populate: {
        path: "seller",
        select: "name email avatar phone university",
      },
    })
    .populate("buyer seller participants", "name email avatar phone university")
    .populate("lastSender", "name email avatar phone university");
}

export async function getConversationMessages(conversationId, { limit = 50 } = {}) {
  return Message.find({ conversation: conversationId })
    .populate("sender", "name email avatar phone university")
    .sort({ createdAt: -1 })
    .limit(limit)
    .then((messages) => messages.reverse());
}

export function serializeMessage(message, conversation) {
  const senderId = getId(message.sender);
  const sellerId = getId(conversation.seller);

  return {
    ...(message.toJSON ? message.toJSON() : message),
    senderId,
    conversationId: getId(message.conversation ?? conversation._id),
    senderRole: senderId === sellerId ? "seller" : "buyer",
  };
}

export function serializeConversation(conversation, { messages = [] } = {}) {
  const payload = conversation.toJSON ? conversation.toJSON() : { ...conversation };
  const productId = getId(conversation.product);
  const buyerId = getId(conversation.buyer);
  const sellerId = getId(conversation.seller);

  return {
    ...payload,
    productId,
    buyerId,
    sellerId,
    buyerName: getName(conversation.buyer, "Interested buyer"),
    sellerName: getName(conversation.seller, "Campus Seller"),
    productStatus: conversation.product?.status ?? payload.productStatus ?? "active",
    messages: messages.map((message) => serializeMessage(message, conversation)),
  };
}
