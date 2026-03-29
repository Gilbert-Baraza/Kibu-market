import { io } from "socket.io-client";
import { sessionStore } from "../api/client";

let socketInstance = null;
let socketUrl = "";

function getSocketUrl() {
  return sessionStore.getApiBaseUrl().replace(/\/api\/?$/, "");
}

function createSocket(token) {
  socketUrl = getSocketUrl();
  socketInstance = io(socketUrl, {
    autoConnect: false,
    transports: ["websocket"],
    auth: {
      token,
    },
  });

  return socketInstance;
}

export function getSocket() {
  return socketInstance;
}

export function connectSocket(token) {
  if (!token) {
    return null;
  }

  const nextUrl = getSocketUrl();
  if (!socketInstance || socketUrl !== nextUrl) {
    if (socketInstance) {
      socketInstance.disconnect();
    }

    createSocket(token);
  }

  socketInstance.auth = { token };

  if (!socketInstance.connected) {
    socketInstance.connect();
  }

  return socketInstance;
}

export function disconnectSocket() {
  if (!socketInstance) {
    return;
  }

  socketInstance.disconnect();
}

export function emitWithAck(event, payload = {}, timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (!socketInstance || !socketInstance.connected) {
      reject(new Error("Socket is not connected."));
      return;
    }

    socketInstance.timeout(timeout).emit(event, payload, (error, response) => {
      if (error) {
        reject(new Error("Socket request timed out."));
        return;
      }

      if (response?.ok === false) {
        reject(new Error(response.error || "Socket request failed."));
        return;
      }

      resolve(response);
    });
  });
}
