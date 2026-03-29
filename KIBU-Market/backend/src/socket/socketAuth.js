import User from "../models/User.js";
import { verifyToken } from "../services/tokenService.js";

export async function socketAuth(socket, next) {
  try {
    const authToken =
      socket.handshake.auth?.token ??
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "") ??
      "";

    if (!authToken) {
      next(new Error("Authentication required."));
      return;
    }

    const payload = verifyToken(authToken);
    const user = await User.findById(payload.sub).select("name email avatar phone university");

    if (!user) {
      next(new Error("Authentication required."));
      return;
    }

    socket.user = user;
    next();
  } catch {
    next(new Error("Invalid or expired token."));
  }
}
