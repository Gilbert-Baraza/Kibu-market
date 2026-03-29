import { param } from "express-validator";

export const savedListingValidator = [
  param("listingId").isMongoId().withMessage("Invalid listing id."),
];