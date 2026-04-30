import { body, param, query } from "express-validator";

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null) {
    return [];
  }

  return [value];
}

function flattenUploadedFiles(req) {
  if (!req?.files) {
    return [];
  }

  if (Array.isArray(req.files)) {
    return req.files;
  }

  return Object.values(req.files).flat();
}

function collectSubmittedImageUrls(req) {
  return [...toArray(req.body?.images), ...toArray(req.body?.image)]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function createImageInputValidator({
  required,
  minMessage,
  urlMessage,
}) {
  return body().custom((_value, { req }) => {
    const submittedUrls = [...new Set(collectSubmittedImageUrls(req))];
    const uploadedFiles = [
      ...(req.file ? [req.file] : []),
      ...flattenUploadedFiles(req),
    ];
    const hasImageInput =
      uploadedFiles.length > 0
      || Object.prototype.hasOwnProperty.call(req.body ?? {}, "images")
      || Object.prototype.hasOwnProperty.call(req.body ?? {}, "image");

    if (!required && !hasImageInput) {
      return true;
    }

    const totalImages = submittedUrls.length + uploadedFiles.length;
    if (totalImages < 1 || totalImages > 3) {
      throw new Error(minMessage);
    }

    if (submittedUrls.some((value) => !isHttpUrl(value))) {
      throw new Error(urlMessage);
    }

    return true;
  });
}

const requiredImageInputValidator = createImageInputValidator({
  required: true,
  minMessage: "Listings must include between 1 and 3 images.",
  urlMessage: "Each image must be a valid http(s) URL.",
});

const optionalImageInputValidator = createImageInputValidator({
  required: false,
  minMessage: "Listings can include between 1 and 3 images.",
  urlMessage: "Each image must be a valid http(s) URL.",
});

export const createListingValidator = [
  body("title").trim().isLength({ min: 3 }).withMessage("Title must be at least 3 characters."),
  body("description")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters."),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number."),
  body("category").trim().notEmpty().withMessage("Category is required."),
  body("condition")
    .optional()
    .isIn(["new", "like new", "good", "fair", "used"])
    .withMessage("Condition is invalid."),
  body("tags").optional().isArray().withMessage("Tags must be an array."),
  requiredImageInputValidator,
  body("location").trim().notEmpty().withMessage("Location is required."),
];

export const updateListingValidator = [
  body("title").optional().trim().isLength({ min: 3 }).withMessage("Title is too short."),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage("Description is too short."),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be a positive number."),
  body("category").optional().trim().notEmpty().withMessage("Category cannot be empty."),
  body("condition")
    .optional()
    .isIn(["new", "like new", "good", "fair", "used"])
    .withMessage("Condition is invalid."),
  body("tags").optional().isArray().withMessage("Tags must be an array."),
  optionalImageInputValidator,
  body("location").optional().trim().notEmpty().withMessage("Location cannot be empty."),
  body("status").optional().isIn(["active", "sold"]).withMessage("Status is invalid."),
  body("listingState").optional().isIn(["active", "sold", "draft", "paused"]).withMessage("listingState is invalid."),
];

export const listingIdValidator = [
  param("id").isMongoId().withMessage("Invalid listing id."),
];

export const listingSearchValidator = [
  query("minPrice").optional().isFloat({ min: 0 }).withMessage("minPrice must be a positive number."),
  query("maxPrice").optional().isFloat({ min: 0 }).withMessage("maxPrice must be a positive number."),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be at least 1."),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("limit must be between 1 and 50."),
  query("status").optional().isIn(["active", "sold"]).withMessage("Status is invalid."),
];
