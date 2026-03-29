import { body, param, query } from "express-validator";

export const createListingValidator = [
  body("title").trim().isLength({ min: 3 }).withMessage("Title must be at least 3 characters."),
  body("description")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters."),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number."),
  body("category").trim().notEmpty().withMessage("Category is required."),
  body("condition")
    .optional()
    .isIn(["new", "like new", "good", "fair", "used"])
    .withMessage("Condition is invalid."),
  body("tags").optional().isArray().withMessage("Tags must be an array."),
  body("images").optional().isArray().withMessage("Images must be an array."),
  body("location").trim().notEmpty().withMessage("Location is required."),
];

export const updateListingValidator = [
  body("title").optional().trim().isLength({ min: 3 }).withMessage("Title is too short."),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage("Description is too short."),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be a positive number."),
  body("category").optional().trim().notEmpty().withMessage("Category cannot be empty."),
  body("condition")
    .optional()
    .isIn(["new", "like new", "good", "fair", "used"])
    .withMessage("Condition is invalid."),
  body("tags").optional().isArray().withMessage("Tags must be an array."),
  body("images").optional().isArray().withMessage("Images must be an array."),
  body("location").optional().trim().notEmpty().withMessage("Location cannot be empty."),
  body("status").optional().isIn(["active", "sold"]).withMessage("Status is invalid."),
  body("listingState").optional().isIn(["active", "sold", "draft", "paused"]).withMessage("listingState is invalid."),
];

export const listingIdValidator = [
  param("id").isMongoId().withMessage("Invalid listing id."),
];

export const listingSearchValidator = [
  query("minPrice").optional().isFloat({ min: 0 }).withMessage("minPrice must be a positive number."),
  query("maxPrice").optional().isFloat({ min: 0 }).withMessage("maxPrice must be a positive number."),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be at least 1."),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("limit must be between 1 and 50."),
  query("status").optional().isIn(["active", "sold"]).withMessage("Status is invalid."),
];