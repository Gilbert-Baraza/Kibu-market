import { Server } from "socket.io";
import env from "../config/env.js";
import { socketAuth } from "./socketAuth.js";
import { registerChatHandlers } from "./chatHandlers.js";
import { registerPresence, unregisterPresence } from "./presence.js";

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    registerPresence(io, socket);
    registerChatHandlers(io, socket);

    socket.on("disconnect", () => {
      unregisterPresence(io, socket);
    });
  });

  return io;
}
