import { Router } from "express";
import Conversation from "../models/Conversation.js";
import asyncHandler from "../utils/asyncHandler.js";
import validateRequest from "../middleware/validateRequest.js";
import { requireAuth } from "../middleware/auth.js";
import { chatRateLimit } from "../middleware/rateLimit.js";
import {
  getConversationMessages,
  getConversations,
  markConversationRead,
  sendConversationMessage,
} from "../controllers/chatController.js";
import {
  conversationIdValidator,
  sendMessageValidator,
} from "../validators/chatValidators.js";
import {
  createMessage,
  startConversationForListing,
} from "../services/chatService.js";
import ApiError from "../utils/ApiError.js";
import {
  getConversationMessages as getHydratedConversationMessages,
  hydrateConversation,
  serializeConversation,
} from "../socket/serializers.js";

const router = Router();

router.use(requireAuth);
router.use(chatRateLimit);

router.get("/", asyncHandler(getConversations));
router.get(
  "/:conversationId/messages",
  conversationIdValidator,
  validateRequest,
  asyncHandler(getConversationMessages),
);

router.post(
  "/",
  sendMessageValidator,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { productId, text } = req.body;

    if (!productId) {
      throw new ApiError(400, "productId is required.");
    }

    const conversation = await startConversationForListing({
      listingId: productId,
      currentUserId: req.user._id,
    });

    await createMessage({
      conversation,
      senderId: req.user._id,
      text,
    });

    const refreshedConversation = await hydrateConversation(conversation._id);
    const messages = await getHydratedConversationMessages(conversation._id);
    const serializedConversation = serializeConversation(refreshedConversation, { messages });

    res.status(201).json({
      message: "Conversation started successfully.",
      conversation: serializedConversation,
      data: serializedConversation,
    });
  }),
);

router.post(
  "/:conversationId/messages",
  conversationIdValidator,
  sendMessageValidator,
  validateRequest,
  asyncHandler(sendConversationMessage),
);

router.patch(
  "/:conversationId/read",
  conversationIdValidator,
  validateRequest,
  asyncHandler(markConversationRead),
);

export default router;
