import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import validateRequest from "../middleware/validateRequest.js";
import { requireAuth } from "../middleware/auth.js";
import {
  getCurrentUser,
  updateCurrentUser,
} from "../controllers/authController.js";
import {
  getMyDashboard,
} from "../controllers/userController.js";
import {
  updateProfileValidator,
} from "../validators/authValidators.js";

const router = Router();

router.use(requireAuth);
router.get("/me", asyncHandler(getCurrentUser));
router.patch(
  "/me",
  updateProfileValidator,
  validateRequest,
  asyncHandler(updateCurrentUser),
);
router.get("/me/dashboard", asyncHandler(getMyDashboard));

export default router;