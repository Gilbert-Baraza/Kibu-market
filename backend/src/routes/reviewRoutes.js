import { Router } from "express";
import { createReview, getSellerReviews, canReview } from "../controllers/reviewController.js";
import { requireAuth } from "../middleware/auth.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  createReviewValidator,
  getSellerReviewsValidator,
  canReviewValidator,
} from "../validators/reviewValidators.js";

const router = Router();

// Public route: Get all reviews for a seller
router.get("/users/:id/reviews", getSellerReviewsValidator, getSellerReviews);

// Protected routes: require authentication
router.use(requireAuth);

// Check if current user can review a seller
router.get("/check", canReviewValidator, validateRequest, canReview);

// Create a new review
router.post("/", createReviewValidator, validateRequest, createReview);

export default router;
