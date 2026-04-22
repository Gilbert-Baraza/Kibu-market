import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import validateRequest from "../middleware/validateRequest.js";
import { requireAuth } from "../middleware/auth.js";
import { authRateLimit } from "../middleware/rateLimit.js";
import {
  getCurrentUser,
  login,
  logout,
  refreshSession,
  register,
  updateCurrentUser,
} from "../controllers/authController.js";
import {
  loginValidator,
  refreshSessionValidator,
  registerValidator,
  updateProfileValidator,
} from "../validators/authValidators.js";

const router = Router();

router.post("/register", authRateLimit, registerValidator, validateRequest, asyncHandler(register));
router.post("/signup", authRateLimit, registerValidator, validateRequest, asyncHandler(register));
router.post("/login", authRateLimit, loginValidator, validateRequest, asyncHandler(login));
router.post("/refresh", authRateLimit, refreshSessionValidator, validateRequest, asyncHandler(refreshSession));
router.post("/logout", requireAuth, asyncHandler(logout));
router.get("/me", requireAuth, asyncHandler(getCurrentUser));
router.put(
  "/me",
  requireAuth,
  updateProfileValidator,
  validateRequest,
  asyncHandler(updateCurrentUser),
);

export default router;
