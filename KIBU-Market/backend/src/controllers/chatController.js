import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  createMessage,
  ensureConversationParticipant,
  markConversationAsRead,
  startConversationForListing,
} from "../services/chatService.js";
import { buildPagination } from "../utils/buildPagination.js";
import { parsePagination } from "../utils/parsePagination.js";

export async function startConversation(req, res) {
  const conversation = await startConversationForListing({
    listingId: req.params.listingId,
    currentUserId: req.user._id,
  });

  res.status(201).json({
    message: "Conversation ready.",
    conversation,
    data: conversation,
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
      .populate("buyer seller participants", "name email avatar phone university")
      .populate("lastSender", "name email avatar")
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Conversation.countDocuments(filters),
  ]);

  res.json({ conversations, data: conversations, pagination: buildPagination(page, limit, total) });
}

export async function getConversation(req, res) {
  const conversation = await ensureConversationParticipant({
    conversationId: req.params.conversationId,
    userId: req.user._id,
  });

  res.json(conversation);
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

  res.json({
    messages: orderedMessages,
    data: orderedMessages,
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

  const refreshedConversation = await Conversation.findById(conversation._id)
    .populate("product", "title price images location status seller")
    .populate("buyer seller participants", "name email avatar phone university")
    .populate("lastSender", "name email avatar");

  res.status(201).json({
    message: "Message sent successfully.",
    conversation: refreshedConversation,
    sentMessage: message,
    data: refreshedConversation,
  });
}

export async function markConversationRead(req, res) {
  const conversation = await ensureConversationParticipant({
    conversationId: req.params.conversationId,
    userId: req.user._id,
  });

  const updatedConversation = await markConversationAsRead({
    conversation,
    userId: req.user._id,
  });

  const messages = await Message.find({ conversation: updatedConversation._id })
    .populate("sender", "name email avatar phone university")
    .sort({ createdAt: -1 })
    .limit(50)
    .then((items) => items.reverse());

  res.json({
    message: "Conversation marked as read.",
    conversation: {
      ...(updatedConversation.toJSON ? updatedConversation.toJSON() : updatedConversation),
      messages,
    },
    data: updatedConversation,
  });
}
