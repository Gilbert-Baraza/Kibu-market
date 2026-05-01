import { body, param, query } from "express-validator";

export const createReviewValidator = [
  body("sellerId")
    .notEmpty()
    .withMessage("sellerId is required.")
    .bail()
    .isMongoId()
    .withMessage("Invalid seller id."),
  body("listingId")
    .notEmpty()
    .withMessage("listingId is required.")
    .bail()
    .isMongoId()
    .withMessage("Invalid listing id."),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be a number between 1 and 5."),
  body("comment")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Comment cannot exceed 500 characters.")
    .trim(),
];

export const getSellerReviewsValidator = [
  param("id").isMongoId().withMessage("Invalid user id."),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer."),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50."),
];

export const canReviewValidator = [
  query("sellerId")
    .notEmpty()
    .withMessage("sellerId is required.")
    .bail()
    .isMongoId()
    .withMessage("Invalid seller id."),
  query("listingId")
    .notEmpty()
    .withMessage("listingId is required.")
    .bail()
    .isMongoId()
    .withMessage("Invalid listing id."),
];
