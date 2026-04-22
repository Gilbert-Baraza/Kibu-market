import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import multer, { MulterError } from "multer";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import { buildImageVariants } from "../utils/imageVariants.js";

const uploadsRoot = path.resolve(process.cwd(), env.uploadsDir);
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const mimeByFormat = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

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

async function persistLocally(file, format, expectedMimeType) {
  await fs.mkdir(uploadsRoot, { recursive: true });

  const filename = `${Date.now()}-${crypto.randomUUID()}.${format}`;
  const filepath = path.join(uploadsRoot, filename);
  await fs.writeFile(filepath, file.buffer, { flag: "wx" });

  return {
    provider: "local",
    filename,
    filepath,
    mimetype: expectedMimeType,
    size: file.size,
  };
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

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      502,
      payload?.error?.message || "Cloudinary upload failed.",
    );
  }

  return {
    provider: "cloudinary",
    filename: payload.public_id,
    url: payload.secure_url ?? payload.url,
    mimetype: expectedMimeType,
    size: file.size,
    width: payload.width ?? null,
    height: payload.height ?? null,
    variants: buildImageVariants(payload.secure_url ?? payload.url),
  };
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.uploadMaxBytes,
    files: 3,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(String(file.mimetype).toLowerCase())) {
      cb(new ApiError(400, "Only JPG, PNG, GIF, and WEBP image uploads are allowed."));
      return;
    }

    cb(null, true);
  },
});

export async function persistValidatedImage(file) {
  if (!file?.buffer?.length) {
    throw new ApiError(400, "Image file is required.");
  }

  const format = detectImageFormat(file.buffer);
  if (!format) {
    throw new ApiError(400, "Uploaded file is not a valid supported image.");
  }

  const expectedMimeType = mimeByFormat[format];
  if (String(file.mimetype).toLowerCase() !== expectedMimeType) {
    throw new ApiError(400, "Uploaded file type does not match the image contents.");
  }

  if (env.useCloudinary) {
    try {
      return await persistToCloudinary(file, format, expectedMimeType);
    } catch (error) {
      if (env.cloudinaryRequired) {
        throw error;
      }

      console.warn("[upload] Cloudinary upload failed; falling back to local storage.", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return persistLocally(file, format, expectedMimeType);
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
