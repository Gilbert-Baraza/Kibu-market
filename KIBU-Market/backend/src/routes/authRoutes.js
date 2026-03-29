import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import validateRequest from "../middleware/validateRequest.js";
import { requireAuth } from "../middleware/auth.js";
import {
  getCurrentUser,
  login,
  register,
  updateCurrentUser,
} from "../controllers/authController.js";
import {
  loginValidator,
  registerValidator,
  updateProfileValidator,
} from "../validators/authValidators.js";

const router = Router();

router.post("/register", registerValidator, validateRequest, asyncHandler(register));
router.post("/signup", registerValidator, validateRequest, asyncHandler(register));
router.post("/login", loginValidator, validateRequest, asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(getCurrentUser));
router.put(
  "/me",
  requireAuth,
  updateProfileValidator,
  validateRequest,
  asyncHandler(updateCurrentUser),
);

export default router;