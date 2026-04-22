import ApiError from "../utils/ApiError.js";
import env from "../config/env.js";

const rateLimitStore = new Map();

function pruneExpiredBuckets(now) {
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (bucket.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

function getClientIdentifier(req) {
  if (req.user?._id) {
    return `user:${String(req.user._id)}`;
  }

  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return `ip:${forwardedFor.split(",")[0].trim()}`;
  }

  return `ip:${req.ip ?? "unknown"}`;
}

export function clearRateLimitStore() {
  rateLimitStore.clear();
}

export function createRateLimit({
  id,
  maxRequests,
  windowMs,
  message,
}) {
  return function rateLimit(req, res, next) {
    const now = Date.now();

    if (rateLimitStore.size > 5000) {
      pruneExpiredBuckets(now);
    }

    const key = `${id}:${getClientIdentifier(req)}`;
    const existingBucket = rateLimitStore.get(key);

    if (!existingBucket || existingBucket.resetAt <= now) {
      const nextBucket = {
        count: 1,
        resetAt: now + windowMs,
      };

      rateLimitStore.set(key, nextBucket);
      res.setHeader("X-RateLimit-Limit", String(maxRequests));
      res.setHeader("X-RateLimit-Remaining", String(Math.max(0, maxRequests - nextBucket.count)));
      res.setHeader("X-RateLimit-Reset", String(Math.ceil(nextBucket.resetAt / 1000)));
      next();
      return;
    }

    existingBucket.count += 1;

    res.setHeader("X-RateLimit-Limit", String(maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, maxRequests - existingBucket.count)));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(existingBucket.resetAt / 1000)));

    if (existingBucket.count > maxRequests) {
      res.setHeader(
        "Retry-After",
        String(Math.max(1, Math.ceil((existingBucket.resetAt - now) / 1000))),
      );
      next(new ApiError(429, message));
      return;
    }

    next();
  };
}

export const authRateLimit = createRateLimit({
  id: "auth",
  maxRequests: env.authRateLimitMax,
  windowMs: env.authRateLimitWindowMs,
  message: "Too many authentication attempts. Please try again in a moment.",
});

export const chatRateLimit = createRateLimit({
  id: "chat",
  maxRequests: env.chatRateLimitMax,
  windowMs: env.chatRateLimitWindowMs,
  message: "Too many chat requests. Please slow down and try again shortly.",
});

export const listingWriteRateLimit = createRateLimit({
  id: "listing-write",
  maxRequests: env.listingRateLimitMax,
  windowMs: env.listingRateLimitWindowMs,
  message: "Too many listing updates. Please wait a bit before trying again.",
});
