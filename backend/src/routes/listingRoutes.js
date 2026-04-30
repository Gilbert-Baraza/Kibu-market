import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import validateRequest from "../middleware/validateRequest.js";
import { requireAuth } from "../middleware/auth.js";
import { listingWriteRateLimit } from "../middleware/rateLimit.js";
import { requireListingOwner } from "../middleware/ownership.js";
import { runImageUploadMiddleware } from "../services/uploadService.js";
import {
  createListing,
  deleteListing,
  getListingById,
  getListings,
  getMyListings,
  markListingAsSold,
  updateListing,
  getTrendingListings,
  getPopularListings,
  incrementListingViews,
} from "../controllers/listingController.js";

import {
  createListingValidator,
  listingIdValidator,
  listingSearchValidator,
  updateListingValidator,
} from "../validators/listingValidators.js";

const router = Router();

router.get("/", listingSearchValidator, validateRequest, asyncHandler(getListings));
router.get("/trending", asyncHandler(getTrendingListings));
router.get("/popular", asyncHandler(getPopularListings));
router.get("/mine", requireAuth, asyncHandler(getMyListings));
router.get("/:id", listingIdValidator, validateRequest, asyncHandler(getListingById));
router.get("/:id/view", listingIdValidator, validateRequest, asyncHandler(incrementListingViews));
router.post(
  "/",
  requireAuth,
  listingWriteRateLimit,
  runImageUploadMiddleware,
  createListingValidator,
  validateRequest,
  asyncHandler(createListing),
);
router.put(
  "/:id",
  requireAuth,
  listingWriteRateLimit,
  listingIdValidator,
  updateListingValidator,
  validateRequest,
  asyncHandler(requireListingOwner),
  asyncHandler(updateListing),
);
router.patch(
  "/:id",
  requireAuth,
  listingWriteRateLimit,
  listingIdValidator,
  updateListingValidator,
  validateRequest,
  asyncHandler(requireListingOwner),
  asyncHandler(updateListing),
);
router.delete(
  "/:id",
  requireAuth,
  listingWriteRateLimit,
  listingIdValidator,
  validateRequest,
  asyncHandler(requireListingOwner),
  asyncHandler(deleteListing),
);
router.patch(
  "/:id/sold",
  requireAuth,
  listingWriteRateLimit,
  listingIdValidator,
  validateRequest,
  asyncHandler(requireListingOwner),
  asyncHandler(markListingAsSold),
);

export default router;
