import Listing from "../models/Listing.js";
import ApiError from "../utils/ApiError.js";

export async function requireListingOwner(req, _res, next) {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    next(new ApiError(404, "Listing not found."));
    return;
  }

  if (String(listing.seller) !== String(req.user._id)) {
    next(new ApiError(403, "You do not have permission to modify this listing."));
    return;
  }

  req.listing = listing;
  next();
}