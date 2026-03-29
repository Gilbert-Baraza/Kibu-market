import { addUserSocket, isUserOnline, listOnlineUserIds, removeUserSocket } from "./userConnections.js";

export function emitPresenceSync(socket) {
  socket.emit("presence:sync", {
    userIds: listOnlineUserIds(),
  });
}

export function registerPresence(io, socket) {
  const connections = addUserSocket(socket.user._id, socket.id);

  if (connections === 1) {
    io.emit("presence:update", {
      userId: String(socket.user._id),
      status: "online",
      isOnline: true,
    });
  }

  emitPresenceSync(socket);
}

export function unregisterPresence(io, socket) {
  const { userId, remainingConnections } = removeUserSocket(socket.id);

  if (!userId || remainingConnections > 0 || isUserOnline(userId)) {
    return;
  }

  io.emit("presence:update", {
    userId,
    status: "offline",
    isOnline: false,
  });
}
