import Listing from "../models/Listing.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { buildPagination } from "../utils/buildPagination.js";
import { parsePagination } from "../utils/parsePagination.js";

export async function saveListing(req, res) {
  const listing = await Listing.findById(req.params.listingId);
  if (!listing) {
    throw new ApiError(404, "Listing not found.");
  }

  // Check if already saved to avoid double counting
  const user = await User.findById(req.user._id);
  const alreadySaved = user.savedListings.some(
    (id) => String(id) === String(listing._id),
  );

  if (!alreadySaved) {
    await Listing.findByIdAndUpdate(listing._id, {
      $inc: { saveCount: 1 },
    });
  }

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { savedListings: listing._id },
  });

  res.status(201).json({
    message: "Listing saved successfully.",
  });
}

export async function unsaveListing(req, res) {
  const listing = await Listing.findById(req.params.listingId);
  if (!listing) {
    throw new ApiError(404, "Listing not found.");
  }

  // Check if currently saved before decrementing
  const user = await User.findById(req.user._id);
  const isCurrentlySaved = user.savedListings.some(
    (id) => String(id) === String(listing._id),
  );

  if (isCurrentlySaved) {
    await Listing.findByIdAndUpdate(listing._id, {
      $inc: { saveCount: -1 },
    });
  }

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { savedListings: req.params.listingId },
  });

  res.json({
    message: "Listing removed from saved items.",
  });
}

export async function getSavedListings(req, res) {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 8 });
  const user = await User.findById(req.user._id).select("savedListings");
  const savedListingIds = user?.savedListings ?? [];
  const pagedIds = savedListingIds.slice(skip, skip + limit);
  const listings = pagedIds.length > 0
    ? await Listing.find({ _id: { $in: pagedIds } })
        .populate("seller", "name email avatar phone university")
    : [];
  const listingMap = new Map(listings.map((listing) => [String(listing._id), listing]));
  const orderedListings = pagedIds
    .map((id) => listingMap.get(String(id)))
    .filter(Boolean);

  res.json({
    listings: orderedListings,
    data: orderedListings,
    pagination: buildPagination(page, limit, savedListingIds.length),
  });
}