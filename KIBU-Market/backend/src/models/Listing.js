import mongoose from "mongoose";
import { buildGalleryVariants, buildImageVariants } from "../utils/imageVariants.js";

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    condition: {
      type: String,
      required: true,
      enum: ["new", "like new", "good", "fair", "used"],
      default: "used",
    },
    tags: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 1 && value.length <= 3;
        },
        message: "Listings must include between 1 and 3 images.",
      },
      default: [],
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "sold"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        ret.image = ret.images?.[0] ?? "";
        ret.gallery = ret.images ?? [];
        ret.imageVariants = buildImageVariants(ret.image);
        ret.galleryVariants = buildGalleryVariants(ret.gallery);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

listingSchema.index({ title: "text", description: "text", category: "text", location: "text", tags: "text" });
listingSchema.index({ seller: 1, status: 1, createdAt: -1 });
listingSchema.index({ category: 1, status: 1, createdAt: -1 });
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ status: 1, price: 1, createdAt: -1 });
listingSchema.index({ category: 1, status: 1, price: 1 });
listingSchema.index({ location: 1, status: 1, createdAt: -1 });
listingSchema.index({ price: 1, status: 1 });

export default mongoose.model("Listing", listingSchema);