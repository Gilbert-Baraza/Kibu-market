import User from "../models/User.js";
import { verifyToken } from "../services/tokenService.js";
import ApiError from "../utils/ApiError.js";

export async function requireAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new ApiError(401, "Authentication required.");
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      throw new ApiError(401, "Authentication required.");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, "Invalid or expired token."));
  }
}