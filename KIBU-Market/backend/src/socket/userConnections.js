const userSocketsMap = new Map();
const socketUsersMap = new Map();

export function addUserSocket(userId, socketId) {
  const normalizedUserId = String(userId);
  const sockets = userSocketsMap.get(normalizedUserId) ?? new Set();
  sockets.add(socketId);
  userSocketsMap.set(normalizedUserId, sockets);
  socketUsersMap.set(socketId, normalizedUserId);
  return sockets.size;
}

export function removeUserSocket(socketId) {
  const userId = socketUsersMap.get(socketId);
  if (!userId) {
    return { userId: null, remainingConnections: 0 };
  }

  const sockets = userSocketsMap.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      userSocketsMap.delete(userId);
    }
  }

  socketUsersMap.delete(socketId);

  return {
    userId,
    remainingConnections: sockets?.size ?? 0,
  };
}

export function getUserSocketIds(userId) {
  return Array.from(userSocketsMap.get(String(userId)) ?? []);
}

export function isUserOnline(userId) {
  return getUserSocketIds(userId).length > 0;
}

export function listOnlineUserIds() {
  return Array.from(userSocketsMap.keys());
}
