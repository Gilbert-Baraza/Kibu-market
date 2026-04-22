import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  getSavedListings,
  saveListing,
  unsaveListing,
} from "../controllers/savedController.js";
import { savedListingValidator } from "../validators/savedValidators.js";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(getSavedListings));
router.post("/:listingId", savedListingValidator, validateRequest, asyncHandler(saveListing));
router.delete("/:listingId", savedListingValidator, validateRequest, asyncHandler(unsaveListing));

export default router;