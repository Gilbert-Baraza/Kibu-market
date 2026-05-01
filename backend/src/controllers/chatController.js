import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  createMessage,
  ensureConversationParticipant,
  markConversationAsRead,
  startConversationForListing,
} from "../services/chatService.js";
import {
  hydrateConversation,
  serializeConversation,
  serializeMessage,
} from "../socket/serializers.js";
import { buildPagination } from "../utils/buildPagination.js";
import { parsePagination } from "../utils/parsePagination.js";

export async function startConversation(req, res) {
  const conversation = await startConversationForListing({
    listingId: req.params.listingId,
    currentUserId: req.user._id,
  });
  const hydratedConversation = await hydrateConversation(conversation._id);

  res.status(201).json({
    message: "Conversation ready.",
    conversation: serializeConversation(hydratedConversation),
    data: serializeConversation(hydratedConversation),
  });
}

export async function getConversations(req, res) {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10 });
  const filters = {
    participants: req.user._id,
  };

  const [conversations, total] = await Promise.all([
    Conversation.find(filters)
      .populate("product", "title price images location status seller")
      .populate("buyer seller participants", "name email avatar phone university rating")
      .populate("lastSender", "name email avatar")
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Conversation.countDocuments(filters),
  ]);

  const serializedConversations = conversations.map((conversation) => serializeConversation(conversation));
  res.json({ conversations: serializedConversations, data: serializedConversations, pagination: buildPagination(page, limit, total) });
}

export async function getConversation(req, res) {
  const conversation = await ensureConversationParticipant({
    conversationId: req.params.conversationId,
    userId: req.user._id,
  });
  const hydratedConversation = await hydrateConversation(conversation._id);

  res.json(serializeConversation(hydratedConversation));
}

export async function getConversationMessages(req, res) {
  const conversation = await ensureConversationParticipant({
    conversationId: req.params.conversationId,
    userId: req.user._id,
  });
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20 });
  const filters = { conversation: conversation._id };

  const [messages, total] = await Promise.all([
    Message.find(filters)
      .populate("sender", "name email avatar phone university")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Message.countDocuments(filters),
  ]);

  const orderedMessages = [...messages].reverse();
  const serializedMessages = orderedMessages.map((message) => serializeMessage(message, conversation));

  res.json({
    messages: serializedMessages,
    data: serializedMessages,
    pagination: buildPagination(page, limit, total),
  });
}

export async function sendConversationMessage(req, res) {
  const conversation = await ensureConversationParticipant({
    conversationId: req.params.conversationId,
    userId: req.user._id,
  });

  const message = await createMessage({
    conversation,
    senderId: req.user._id,
    text: req.body.text,
  });

  const refreshedConversation = await hydrateConversation(conversation._id);
  const serializedMessage = serializeMessage(message, refreshedConversation);
  const serializedConversation = serializeConversation(refreshedConversation, {
    messages: [message],
  });

  res.status(201).json({
    message: "Message sent successfully.",
    conversation: serializedConversation,
    sentMessage: serializedMessage,
    data: serializedConversation,
  });
}

export async function markConversationRead(req, res) {
  const conversation = await ensureConversationParticipant({
    conversationId: req.params.conversationId,
    userId: req.user._id,
  });

  const { conversation: updatedConversation, readMessageIds } = await markConversationAsRead({
    conversation,
    userId: req.user._id,
  });

  const hydratedConversation = await hydrateConversation(updatedConversation._id);
  const serializedConversation = serializeConversation(hydratedConversation);

  res.json({
    message: "Conversation marked as read.",
    conversation: serializedConversation,
    readMessageIds,
    readerId: req.user.id,
    data: updatedConversation,
  });
}
