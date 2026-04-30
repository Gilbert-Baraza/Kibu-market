import Listing from "../models/Listing.js";
import { collectUploadedFiles, persistValidatedImage } from "../services/uploadService.js";
import { buildPagination } from "../utils/buildPagination.js";
import ApiError from "../utils/ApiError.js";
import { parseListingFilters } from "../utils/parseListingFilters.js";
import { logAuditEvent } from "../utils/auditLogger.js";
import { pick } from "../utils/pick.js";

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null) {
    return [];
  }

  return [value];
}

function normalizeImages(value) {
  return [...new Set(toArray(value).map((image) => String(image ?? "").trim()).filter(Boolean))];
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((tag) => String(tag ?? "").trim().toLowerCase()).filter(Boolean))];
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return [];
    }

    try {
      const parsedValue = JSON.parse(normalizedValue);
      if (Array.isArray(parsedValue)) {
        return normalizeTags(parsedValue);
      }
    } catch {
      // Treat plain multipart text fields as a single tag.
    }

    return [normalizedValue.toLowerCase()];
  }

  return [];
}

function collectBodyImages(body) {
  return normalizeImages([
    ...toArray(body.images),
    ...toArray(body.image),
  ]);
}

async function resolveListingImages(req) {
  const uploadedFiles = collectUploadedFiles(req);
  const bodyImages = collectBodyImages(req.body);

  if (uploadedFiles.length === 0) {
    return bodyImages;
  }

  const savedFiles = await Promise.all(uploadedFiles.map((file) => persistValidatedImage(file)));
  const uploadedUrls = savedFiles.map((savedFile) => {
    if (!savedFile.url) {
      throw new ApiError(502, "Cloudinary upload did not return a secure image URL.");
    }

    return savedFile.url;
  });
  const images = normalizeImages([...bodyImages, ...uploadedUrls]);

  if (images.length < 1 || images.length > 3) {
    throw new ApiError(400, "Listings must include between 1 and 3 images.");
  }

  return images;
}

function normalizeListingPayload(body) {
  const payload = pick(body, [
    "title",
    "description",
    "price",
    "category",
    "condition",
    "location",
  ]);

  if (body.tags !== undefined) {
    payload.tags = normalizeTags(body.tags);
  }

  const images = collectBodyImages(body);
  if (images.length > 0) {
    payload.images = images;
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
  const images = await resolveListingImages(req);
  const payload = normalizeListingPayload(req.body);

  if (images.length > 0) {
    payload.images = images;
  }

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
  const listingSnapshot = {
    id: req.listing.id,
    title: req.listing.title,
    status: req.listing.status,
  };

  await req.listing.deleteOne();

  logAuditEvent(req, {
    action: "listing.delete",
    status: "success",
    targetType: "listing",
    targetId: listingSnapshot.id,
    metadata: {
      title: listingSnapshot.title,
      status: listingSnapshot.status,
    },
  });

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
