import crypto from "crypto";
import jwt from "jsonwebtoken";
import env from "../config/env.js";

function parseDurationToMs(value) {
  const normalizedValue = String(value ?? "").trim();
  const match = normalizedValue.match(/^(\d+)(ms|s|m|h|d)$/i);

  if (!match) {
    throw new Error(`Unsupported duration format: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
}

export function generateAccessToken(userId) {
  return jwt.sign({ sub: userId, type: "access" }, env.jwtSecret, {
    expiresIn: env.accessTokenExpiresIn,
  });
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);

  if (payload.type !== "access") {
    throw new Error("Invalid token type.");
  }

  return payload;
}

export function generateRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

export function getAccessTokenExpiryDate() {
  return new Date(Date.now() + parseDurationToMs(env.accessTokenExpiresIn));
}

export function getRefreshTokenExpiryDate() {
  return new Date(Date.now() + parseDurationToMs(env.refreshTokenExpiresIn));
}
