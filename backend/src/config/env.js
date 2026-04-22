import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY || "";
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET || "";
const cloudinaryFolder = process.env.CLOUDINARY_FOLDER || "kibu-market";
const cloudinaryEnabled = process.env.CLOUDINARY_ENABLED !== "true";
const cloudinaryRequired = process.env.CLOUDINARY_REQUIRED === "true";

const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  isDevelopment: nodeEnv === "development",
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kibu-market",
  jwtSecret: process.env.JWT_SECRET || "replace-with-a-strong-secret",
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || process.env.JWT_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  trustProxy: process.env.TRUST_PROXY || false,
  bodySizeLimit: process.env.BODY_SIZE_LIMIT || "1mb",
  uploadMaxBytes: Number(process.env.UPLOAD_MAX_BYTES) || 5 * 1024 * 1024,
  cloudinaryCloudName,
  cloudinaryApiKey,
  cloudinaryApiSecret,
  cloudinaryFolder,
  cloudinaryEnabled,
  cloudinaryRequired,
  useCloudinary:
    nodeEnv !== "test" &&
    cloudinaryEnabled &&
    Boolean(cloudinaryCloudName) &&
    Boolean(cloudinaryApiKey) &&
    Boolean(cloudinaryApiSecret),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 5,
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 60000,
  chatRateLimitMax: Number(process.env.CHAT_RATE_LIMIT_MAX) || 20,
  chatRateLimitWindowMs: Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS) || 60000,
  listingRateLimitMax: Number(process.env.LISTING_RATE_LIMIT_MAX) || 10,
  listingRateLimitWindowMs: Number(process.env.LISTING_RATE_LIMIT_WINDOW_MS) || 60000,
  uploadsDir: "uploads",
};

export default env;
