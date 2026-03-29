import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import validateRequest from "../middleware/validateRequest.js";
import { requireAuth } from "../middleware/auth.js";
import {
  getConversation,
  getConversationMessages,
  getConversations,
  markConversationRead,
  sendConversationMessage,
  startConversation,
} from "../controllers/chatController.js";
import {
  conversationIdValidator,
  listingChatValidator,
  sendMessageValidator,
} from "../validators/chatValidators.js";

const router = Router();

router.use(requireAuth);

router.post("/start/:listingId", listingChatValidator, validateRequest, asyncHandler(startConversation));
router.get("/conversations", asyncHandler(getConversations));
router.get(
  "/conversations/:conversationId",
  conversationIdValidator,
  validateRequest,
  asyncHandler(getConversation),
);
router.get(
  "/conversations/:conversationId/messages",
  conversationIdValidator,
  validateRequest,
  asyncHandler(getConversationMessages),
);
router.post(
  "/conversations/:conversationId/messages",
  conversationIdValidator,
  sendMessageValidator,
  validateRequest,
  asyncHandler(sendConversationMessage),
);
router.patch(
  "/conversations/:conversationId/read",
  conversationIdValidator,
  validateRequest,
  asyncHandler(markConversationRead),
);

export default router;