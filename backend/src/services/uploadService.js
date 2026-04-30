import crypto from "crypto";
import multer, { MulterError } from "multer";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import { buildImageVariants } from "../utils/imageVariants.js";

const maxUploadFiles = 3;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const mimeByFormat = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};
export const imageUploadFields = [
  { name: "file", maxCount: 1 },
  { name: "files", maxCount: maxUploadFiles },
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: maxUploadFiles },
];

function logUploadDebug(message, metadata = {}) {
  if (!env.isDevelopment) {
    return;
  }

  console.info("[upload]", message, metadata);
}

function startsWithBytes(buffer, bytes) {
  return bytes.every((byte, index) => buffer[index] === byte);
}

function isPng(buffer) {
  return startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}

function isJpeg(buffer) {
  return buffer[0] === 0xff
    && buffer[1] === 0xd8
    && buffer[buffer.length - 2] === 0xff
    && buffer[buffer.length - 1] === 0xd9;
}

function isGif(buffer) {
  return startsWithBytes(buffer, [0x47, 0x49, 0x46, 0x38]);
}

function isWebp(buffer) {
  return startsWithBytes(buffer, [0x52, 0x49, 0x46, 0x46])
    && buffer[8] === 0x57
    && buffer[9] === 0x45
    && buffer[10] === 0x42
    && buffer[11] === 0x50;
}

function detectImageFormat(buffer) {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  if (isPng(buffer)) {
    return "png";
  }

  if (isJpeg(buffer)) {
    return "jpg";
  }

  if (isGif(buffer)) {
    return "gif";
  }

  if (isWebp(buffer)) {
    return "webp";
  }

  return null;
}

function createCloudinarySignature(params) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${payload}${env.cloudinaryApiSecret}`)
    .digest("hex");
}

async function persistToCloudinary(file, format, expectedMimeType) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    folder: env.cloudinaryFolder,
    timestamp,
  };
  const signature = createCloudinarySignature(params);
  const formData = new FormData();

  formData.append("file", new Blob([file.buffer], { type: expectedMimeType }), `upload.${format}`);
  formData.append("api_key", env.cloudinaryApiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);

  if (env.cloudinaryFolder) {
    formData.append("folder", env.cloudinaryFolder);
  }

  logUploadDebug("Uploading image to Cloudinary.", {
    filename: file.originalname ?? `upload.${format}`,
    mimetype: expectedMimeType,
    size: file.size,
    folder: env.cloudinaryFolder,
  });

  let response;
  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );
  } catch (error) {
    logUploadDebug("Cloudinary request failed before a response was received.", {
      message: error.message,
    });
    throw new ApiError(502, "Cloudinary upload request failed.");
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    logUploadDebug("Cloudinary rejected the upload.", {
      status: response.status ?? null,
      message: payload?.error?.message ?? null,
    });
    throw new ApiError(
      502,
      payload?.error?.message || "Cloudinary upload failed.",
    );
  }

  if (!payload.secure_url) {
    logUploadDebug("Cloudinary response was missing secure_url.", {
      publicId: payload.public_id ?? null,
    });
    throw new ApiError(502, "Cloudinary upload did not return a secure image URL.");
  }

  return {
    provider: "cloudinary",
    filename: payload.public_id,
    url: payload.secure_url,
    mimetype: expectedMimeType,
    size: file.size,
    width: payload.width ?? null,
    height: payload.height ?? null,
    variants: buildImageVariants(payload.secure_url),
  };
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.uploadMaxBytes,
    files: maxUploadFiles,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(String(file.mimetype).toLowerCase())) {
      cb(new ApiError(400, "Only JPG, PNG, GIF, and WEBP image uploads are allowed."));
      return;
    }

    cb(null, true);
  },
});

function flattenUploadedFiles(files) {
  if (!files) {
    return [];
  }

  if (Array.isArray(files)) {
    return files;
  }

  return Object.values(files).flat();
}

export function collectUploadedFiles(req, maxFiles = maxUploadFiles) {
  return [
    ...(req.file ? [req.file] : []),
    ...flattenUploadedFiles(req.files),
  ].filter(Boolean).slice(0, maxFiles);
}

export function runImageUploadMiddleware(req, res, next) {
  upload.fields(imageUploadFields)(req, res, (error) => {
    if (error) {
      next(normalizeUploadError(error));
      return;
    }

    next();
  });
}

export async function persistValidatedImage(file) {
  if (!file?.buffer?.length) {
    throw new ApiError(400, "Image file is required.");
  }

  if (!env.useCloudinary) {
    logUploadDebug("Cloudinary upload skipped because credentials are incomplete.");
    throw new ApiError(503, "Image uploads require a valid Cloudinary configuration.");
  }

  const format = detectImageFormat(file.buffer);
  if (!format) {
    throw new ApiError(400, "Uploaded file is not a valid supported image.");
  }

  const expectedMimeType = mimeByFormat[format];
  if (String(file.mimetype).toLowerCase() !== expectedMimeType) {
    throw new ApiError(400, "Uploaded file type does not match the image contents.");
  }

  return persistToCloudinary(file, format, expectedMimeType);
}

export function normalizeUploadError(error) {
  if (!error) {
    return null;
  }

  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return new ApiError(400, `Image uploads must be ${Math.floor(env.uploadMaxBytes / (1024 * 1024))}MB or smaller.`);
    }

    return new ApiError(400, error.message || "Upload request could not be processed.");
  }

  return new ApiError(400, error.message || "Upload request could not be processed.");
}
