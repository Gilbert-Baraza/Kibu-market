import Listing from "../models/Listing.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

export async function saveListing(req, res) {
  const listing = await Listing.findById(req.params.listingId);
  if (!listing) {
    throw new ApiError(404, "Listing not found.");
  }

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { savedListings: listing._id },
  });

  res.status(201).json({
    message: "Listing saved successfully.",
  });
}

export async function unsaveListing(req, res) {
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { savedListings: req.params.listingId },
  });

  res.json({
    message: "Listing removed from saved items.",
  });
}

export async function getSavedListings(req, res) {
  const user = await User.findById(req.user._id).populate({
    path: "savedListings",
    populate: {
      path: "seller",
      select: "name email avatar phone university",
    },
  });

  const listings = user?.savedListings ?? [];

  res.json({
    listings,
    data: listings,
  });
}