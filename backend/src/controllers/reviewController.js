import mongoose from "mongoose";
import Review from "../models/Review.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import ApiError from "../utils/ApiError.js";

const REVIEW_INELIGIBILITY_MESSAGES = {
  missing_ids: "We could not confirm the seller or listing for this rating.",
  self: "You cannot rate your own listing.",
  seller_not_found: "This seller could not be found.",
  no_conversation: "You can rate a seller after chatting with them about this listing.",
  already_reviewed: "You have already reviewed this seller for this listing.",
};

function getReviewerId(req) {
  const reviewerId = req.user?._id ?? req.user?.id;

  if (!reviewerId) {
    throw new ApiError(401, "Authentication required.");
  }

  return reviewerId;
}

function buildIneligibleResponse(reason) {
  return {
    canReview: false,
    reason,
    message: REVIEW_INELIGIBILITY_MESSAGES[reason] ?? "You cannot review this seller right now.",
  };
}

function toEligibilityError(reason) {
  const statusCode = reason === "seller_not_found" ? 404 : 400;
  return new ApiError(statusCode, buildIneligibleResponse(reason).message);
}

async function evaluateReviewEligibility({ reviewerId, sellerId, listingId }) {
  if (!sellerId || !listingId) {
    return buildIneligibleResponse("missing_ids");
  }

  if (String(sellerId) === String(reviewerId)) {
    return buildIneligibleResponse("self");
  }

  const sellerExists = await User.exists({ _id: sellerId });
  if (!sellerExists) {
    return buildIneligibleResponse("seller_not_found");
  }

  const conversation = await Conversation.findOne({
    product: listingId,
    participants: { $all: [reviewerId, sellerId] },
  }).select("_id");

  if (!conversation) {
    return {
      ...buildIneligibleResponse("no_conversation"),
      conversation: null,
    };
  }

  const existingReview = await Review.exists({
    reviewerId,
    sellerId,
    listingId,
  });

  if (existingReview) {
    return {
      ...buildIneligibleResponse("already_reviewed"),
      conversation,
    };
  }

  return {
    canReview: true,
    conversation,
  };
}

async function syncSellerRating(sellerId) {
  const normalizedSellerId = new mongoose.Types.ObjectId(String(sellerId));
  const [stats] = await Review.aggregate([
    { $match: { sellerId: normalizedSellerId } },
    {
      $group: {
        _id: "$sellerId",
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  await User.findByIdAndUpdate(sellerId, {
    "rating.average": stats ? Math.round(stats.average * 10) / 10 : 0,
    "rating.count": stats?.count ?? 0,
  });
}

/**
 * POST /api/reviews
 * Create a new review for a seller
 */
export async function createReview(req, res, next) {
  try {
    const reviewerId = getReviewerId(req);
    const { sellerId, listingId, rating, comment } = req.body;
    const numericRating = Number(rating);

    // Validate rating range
    if (numericRating < 1 || numericRating > 5) {
      throw new ApiError(400, "Rating must be between 1 and 5 stars.");
    }

    const eligibility = await evaluateReviewEligibility({
      reviewerId,
      sellerId,
      listingId,
    });

    if (!eligibility.canReview) {
      throw toEligibilityError(eligibility.reason);
    }

    // Create the review
    const review = await Review.create({
      reviewerId,
      sellerId,
      listingId,
      conversationId: eligibility.conversation._id,
      rating: numericRating,
      comment: comment || "",
    });

    await syncSellerRating(sellerId);

    // Return the created review with populated data
    const populatedReview = await Review.findById(review._id)
      .populate("reviewerId", "name avatar")
      .populate("sellerId", "name rating");

    res.status(201).json({
      success: true,
      data: populatedReview,
    });
  } catch (error) {
    if (error?.code === 11000) {
      next(new ApiError(400, REVIEW_INELIGIBILITY_MESSAGES.already_reviewed));
      return;
    }

    next(error);
  }
}

/**
 * GET /api/users/:id/reviews
 * Get all reviews for a seller
 */
export async function getSellerReviews(req, res, next) {
  try {
    const { id } = req.params;

    // Validate that the user exists
    const seller = await User.findById(id);
    if (!seller) {
      throw new ApiError(404, "Seller not found.");
    }

    // Get pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    // Get reviews with pagination
    const reviews = await Review.find({ sellerId: id })
      .populate("reviewerId", "name avatar")
      .populate("sellerId", "name rating")
      .populate("listingId", "title image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ sellerId: id });

    res.json({
      success: true,
      data: {
        seller: {
          id: seller._id,
          name: seller.name,
          rating: seller.rating,
        },
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reviews/check
 * Check if current user can review a seller for a specific listing
 */
export async function canReview(req, res, next) {
  try {
    const reviewerId = getReviewerId(req);
    const { sellerId, listingId } = req.query;
    const eligibility = await evaluateReviewEligibility({
      reviewerId,
      sellerId,
      listingId,
    });

    res.json({
      success: true,
      data: eligibility.canReview
        ? { canReview: true }
        : {
            canReview: false,
            reason: eligibility.reason,
            message: eligibility.message,
          },
    });
  } catch (error) {
    next(error);
  }
}
