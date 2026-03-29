import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  createMessage,
  ensureConversationParticipant,
  markConversationAsRead,
  startConversationForListing,
} from "../services/chatService.js";

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
  const conversations = await Conversation.find({
    participants: req.user._id,
  })
    .populate("product", "title price images location status seller")
    .populate("buyer seller participants", "name email avatar phone university")
    .populate("lastSender", "name email avatar")
    .sort({ lastMessageAt: -1, updatedAt: -1 });

  res.json({ conversations, data: conversations });
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

  const messages = await Message.find({ conversation: conversation._id })
    .populate("sender", "name email avatar phone university")
    .sort({ createdAt: 1 });

  res.json({ messages, data: messages });
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

  res.json({
    message: "Conversation marked as read.",
    conversation: updatedConversation,
    data: updatedConversation,
  });
}