import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import {
  createMessage,
  ensureConversationParticipant,
  markConversationAsRead,
  startConversationForListing,
} from "../services/chatService.js";
import { getUserSocketIds } from "./userConnections.js";
import {
  getConversationMessages,
  getConversationRoomName,
  hydrateConversation,
  serializeConversation,
  serializeMessage,
} from "./serializers.js";

function acknowledge(ack, payload) {
  if (typeof ack === "function") {
    ack(payload);
  }
}

function emitSocketError(socket, ack, error) {
  const message = error instanceof ApiError ? error.message : error.message || "Socket event failed.";
  const status = error instanceof ApiError ? error.statusCode : 500;

  socket.emit("error:event", {
    message,
    status,
  });

  acknowledge(ack, {
    ok: false,
    error: message,
    status,
  });
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function isUserViewingConversation(io, userId, conversationId) {
  const roomName = getConversationRoomName(conversationId);
  const roomSockets = io.sockets.adapter.rooms.get(roomName);

  if (!roomSockets || roomSockets.size === 0) {
    return false;
  }

  return getUserSocketIds(userId).some((socketId) => roomSockets.has(socketId));
}

async function emitConversationState(io, conversationId, options = {}) {
  const conversation = await hydrateConversation(conversationId);
  if (!conversation) {
    return null;
  }

  const serializedConversation = serializeConversation(conversation, options);
  io.to(getConversationRoomName(conversationId)).emit("conversation:updated", {
    conversation: serializedConversation,
  });

  conversation.participants.forEach((participant) => {
    io.to(`user:${participant.id}`).emit("conversation:updated", {
      conversation: serializedConversation,
    });
  });

  return serializedConversation;
}

export function registerChatHandlers(io, socket) {
  socket.join(`user:${socket.user.id}`);

  socket.on("conversation:join", async (payload = {}, ack) => {
    try {
      const { conversationId } = payload;
      if (!isValidObjectId(conversationId)) {
        throw new ApiError(400, "Invalid conversation id.");
      }

      const conversation = await ensureConversationParticipant({
        conversationId,
        userId: socket.user._id,
      });

      socket.join(getConversationRoomName(conversationId));

      const messages = await getConversationMessages(conversationId);
      const serializedConversation = serializeConversation(conversation, { messages });

      socket.emit("conversation:joined", {
        conversationId,
      });

      acknowledge(ack, {
        ok: true,
        conversation: serializedConversation,
      });
    } catch (error) {
      emitSocketError(socket, ack, error);
    }
  });

  socket.on("conversation:leave", (payload = {}, ack) => {
    const { conversationId } = payload;
    if (conversationId) {
      socket.leave(getConversationRoomName(conversationId));
    }

    acknowledge(ack, { ok: true });
  });

  socket.on("message:send", async (payload = {}, ack) => {
    try {
      const text = String(payload.text ?? "").trim();
      if (!text) {
        throw new ApiError(400, "Message text is required.");
      }

      let conversation;
      if (payload.conversationId) {
        if (!isValidObjectId(payload.conversationId)) {
          throw new ApiError(400, "Invalid conversation id.");
        }

        conversation = await ensureConversationParticipant({
          conversationId: payload.conversationId,
          userId: socket.user._id,
        });
      } else {
        if (!isValidObjectId(payload.productId)) {
          throw new ApiError(400, "Invalid product id.");
        }

        conversation = await startConversationForListing({
          listingId: payload.productId,
          currentUserId: socket.user._id,
        });
      }

      const roomName = getConversationRoomName(conversation.id);
      socket.join(roomName);

      const message = await createMessage({
        conversation,
        senderId: socket.user._id,
        text,
      });

      const refreshedConversation = await hydrateConversation(conversation.id);
      const serializedMessage = serializeMessage(message, refreshedConversation);
      const serializedConversation = serializeConversation(refreshedConversation, {
        messages: [message],
      });

      io.to(roomName).emit("message:new", {
        conversationId: refreshedConversation.id,
        message: serializedMessage,
        conversation: serializedConversation,
      });

      refreshedConversation.participants.forEach((participant) => {
        io.to(`user:${participant.id}`).emit("conversation:updated", {
          conversation: serializedConversation,
        });
      });

      const recipient = refreshedConversation.participants.find(
        (participant) => String(participant.id) !== String(socket.user.id),
      );

      if (recipient && isUserViewingConversation(io, recipient.id, refreshedConversation.id)) {
        const readConversation = await markConversationAsRead({
          conversation: refreshedConversation,
          userId: recipient.id,
        });
        const hydratedReadConversation = await hydrateConversation(readConversation.id);
        const readPayload = serializeConversation(hydratedReadConversation);

        io.to(roomName).emit("conversation:read:update", {
          conversationId: hydratedReadConversation.id,
          unreadCounts: hydratedReadConversation.unreadCounts,
          conversation: readPayload,
          readerId: recipient.id,
        });

        hydratedReadConversation.participants.forEach((participant) => {
          io.to(`user:${participant.id}`).emit("conversation:updated", {
            conversation: readPayload,
          });
        });
      }

      acknowledge(ack, {
        ok: true,
        conversation: serializedConversation,
        message: serializedMessage,
      });
    } catch (error) {
      emitSocketError(socket, ack, error);
    }
  });

  socket.on("conversation:read", async (payload = {}, ack) => {
    try {
      const { conversationId } = payload;
      if (!isValidObjectId(conversationId)) {
        throw new ApiError(400, "Invalid conversation id.");
      }

      const conversation = await ensureConversationParticipant({
        conversationId,
        userId: socket.user._id,
      });

      const updatedConversation = await markConversationAsRead({
        conversation,
        userId: socket.user._id,
      });

      const hydratedConversation = await hydrateConversation(updatedConversation.id);
      const serializedConversation = serializeConversation(hydratedConversation);

      io.to(getConversationRoomName(conversationId)).emit("conversation:read:update", {
        conversationId,
        unreadCounts: hydratedConversation.unreadCounts,
        conversation: serializedConversation,
        readerId: socket.user.id,
      });

      hydratedConversation.participants.forEach((participant) => {
        io.to(`user:${participant.id}`).emit("conversation:updated", {
          conversation: serializedConversation,
        });
      });

      acknowledge(ack, {
        ok: true,
        conversation: serializedConversation,
      });
    } catch (error) {
      emitSocketError(socket, ack, error);
    }
  });

  socket.on("typing:start", async (payload = {}, ack) => {
    try {
      const { conversationId } = payload;
      if (!isValidObjectId(conversationId)) {
        throw new ApiError(400, "Invalid conversation id.");
      }

      await ensureConversationParticipant({
        conversationId,
        userId: socket.user._id,
      });

      socket.to(getConversationRoomName(conversationId)).emit("typing:update", {
        conversationId,
        userId: socket.user.id,
        userName: socket.user.name,
        isTyping: true,
      });

      acknowledge(ack, { ok: true });
    } catch (error) {
      emitSocketError(socket, ack, error);
    }
  });

  socket.on("typing:stop", async (payload = {}, ack) => {
    try {
      const { conversationId } = payload;
      if (!isValidObjectId(conversationId)) {
        throw new ApiError(400, "Invalid conversation id.");
      }

      await ensureConversationParticipant({
        conversationId,
        userId: socket.user._id,
      });

      socket.to(getConversationRoomName(conversationId)).emit("typing:update", {
        conversationId,
        userId: socket.user.id,
        userName: socket.user.name,
        isTyping: false,
      });

      acknowledge(ack, { ok: true });
    } catch (error) {
      emitSocketError(socket, ack, error);
    }
  });
}
