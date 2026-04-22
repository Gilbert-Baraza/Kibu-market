import { useEffect, useRef, useState } from "react";
import { connectSocket, disconnectSocket, emitWithAck, getSocket } from "../socket/socket";

export function useSocket({
  enabled,
  token,
  onConversationUpdated,
  onConversationReadUpdate,
  onError,
  onMessageNew,
  onPresenceSync,
  onPresenceUpdate,
  onTypingUpdate,
}) {
  const [isConnected, setIsConnected] = useState(false);
  const handlersRef = useRef({
    onConversationUpdated,
    onConversationReadUpdate,
    onError,
    onMessageNew,
    onPresenceSync,
    onPresenceUpdate,
    onTypingUpdate,
  });

  useEffect(() => {
    handlersRef.current = {
      onConversationUpdated,
      onConversationReadUpdate,
      onError,
      onMessageNew,
      onPresenceSync,
      onPresenceUpdate,
      onTypingUpdate,
    };
  }, [
    onConversationUpdated,
    onConversationReadUpdate,
    onError,
    onMessageNew,
    onPresenceSync,
    onPresenceUpdate,
    onTypingUpdate,
  ]);

  useEffect(() => {
    if (!enabled || !token) {
      disconnectSocket();
      return undefined;
    }

    const socket = connectSocket(token);
    if (!socket) {
      return undefined;
    }

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleConnectError = (error) => {
      setIsConnected(false);
      handlersRef.current.onError?.(error?.message ?? "Unable to connect to real-time chat.");
    };
    const handleMessageNew = (payload) => handlersRef.current.onMessageNew?.(payload);
    const handleConversationUpdated = (payload) => handlersRef.current.onConversationUpdated?.(payload);
    const handleConversationReadUpdate = (payload) => handlersRef.current.onConversationReadUpdate?.(payload);
    const handlePresenceSync = (payload) => handlersRef.current.onPresenceSync?.(payload);
    const handlePresenceUpdate = (payload) => handlersRef.current.onPresenceUpdate?.(payload);
    const handleTypingUpdate = (payload) => handlersRef.current.onTypingUpdate?.(payload);
    const handleErrorEvent = (payload) => handlersRef.current.onError?.(payload?.message ?? "Socket event failed.");

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("message:new", handleMessageNew);
    socket.on("conversation:updated", handleConversationUpdated);
    socket.on("conversation:read:update", handleConversationReadUpdate);
    socket.on("presence:sync", handlePresenceSync);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("typing:update", handleTypingUpdate);
    socket.on("error:event", handleErrorEvent);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("message:new", handleMessageNew);
      socket.off("conversation:updated", handleConversationUpdated);
      socket.off("conversation:read:update", handleConversationReadUpdate);
      socket.off("presence:sync", handlePresenceSync);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("typing:update", handleTypingUpdate);
      socket.off("error:event", handleErrorEvent);
      disconnectSocket();
    };
  }, [enabled, token]);

  return {
    socket: getSocket(),
    isConnected,
    joinConversation(conversationId) {
      return emitWithAck("conversation:join", { conversationId });
    },
    leaveConversation(conversationId) {
      return emitWithAck("conversation:leave", { conversationId });
    },
    sendMessage(payload) {
      return emitWithAck("message:send", payload);
    },
    markConversationRead(conversationId) {
      return emitWithAck("conversation:read", { conversationId });
    },
    startTyping(conversationId) {
      return emitWithAck("typing:start", { conversationId });
    },
    stopTyping(conversationId) {
      return emitWithAck("typing:stop", { conversationId });
    },
  };
}
