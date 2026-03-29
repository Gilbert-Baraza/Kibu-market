import Listing from "../models/Listing.js";
import { buildPagination } from "../utils/buildPagination.js";
import { parseListingFilters } from "../utils/parseListingFilters.js";
import { pick } from "../utils/pick.js";

function normalizeListingPayload(body) {
  const payload = pick(body, [
    "title",
    "description",
    "price",
    "category",
    "condition",
    "location",
    "tags",
  ]);

  if (Array.isArray(body.images)) {
    payload.images = body.images;
  } else if (body.image) {
    payload.images = [body.image];
  }

  if (body.status) {
    payload.status = body.status;
  } else if (body.listingState === "sold") {
    payload.status = "sold";
  } else if (body.listingState) {
    payload.status = "active";
  }

  if (!payload.condition) {
    payload.condition = "used";
  }

  return payload;
}

export async function createListing(req, res) {
  const payload = normalizeListingPayload(req.body);

  const listing = await Listing.create({
    ...payload,
    seller: req.user._id,
  });

  const populatedListing = await listing.populate("seller", "name email avatar phone university");

  res.status(201).json({
    message: "Listing created successfully.",
    listing: populatedListing,
    product: populatedListing,
    data: populatedListing,
  });
}

export async function getListings(req, res) {
  const { filters, sort, page, limit } = parseListingFilters(req.query);
  const skip = (page - 1) * limit;

  const [listings, total] = await Promise.all([
    Listing.find(filters)
      .populate("seller", "name email avatar phone university")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Listing.countDocuments(filters),
  ]);

  res.json({
    listings,
    data: listings,
    pagination: buildPagination(page, limit, total),
  });
}

export async function getListingById(req, res) {
  const listing = await Listing.findById(req.params.id).populate(
    "seller",
    "name email avatar phone university createdAt",
  );

  if (!listing) {
    res.status(404).json({ message: "Listing not found." });
    return;
  }

  res.json(listing);
}

export async function updateListing(req, res) {
  const updates = normalizeListingPayload(req.body);

  Object.assign(req.listing, updates);
  await req.listing.save();
  await req.listing.populate("seller", "name email avatar phone university");

  res.json({
    message: "Listing updated successfully.",
    listing: req.listing,
    product: req.listing,
    data: req.listing,
  });
}

export async function deleteListing(req, res) {
  await req.listing.deleteOne();

  res.json({
    message: "Listing deleted successfully.",
  });
}

export async function markListingAsSold(req, res) {
  req.listing.status = "sold";
  await req.listing.save();
  await req.listing.populate("seller", "name email avatar phone university");

  res.json({
    message: "Listing marked as sold.",
    listing: req.listing,
    product: req.listing,
    data: req.listing,
  });
}

export async function getMyListings(req, res) {
  const listings = await Listing.find({ seller: req.user._id })
    .populate("seller", "name email avatar phone university")
    .sort({ createdAt: -1 });

  res.json({ listings, data: listings });
}