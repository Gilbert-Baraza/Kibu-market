import { body, param } from "express-validator";

export const listingChatValidator = [
  param("listingId").isMongoId().withMessage("Invalid listing id."),
];

export const conversationIdValidator = [
  param("conversationId").isMongoId().withMessage("Invalid conversation id."),
];

export const sendMessageValidator = [
  body("text").trim().isLength({ min: 1 }).withMessage("Message text is required."),
];