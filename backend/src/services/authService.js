import bcrypt from "bcryptjs";
import ApiError from "../utils/ApiError.js";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenExpiryDate,
  getRefreshTokenExpiryDate,
  hashToken,
} from "./tokenService.js";

async function issueSession(user) {
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const refreshTokenExpiresAt = getRefreshTokenExpiryDate();

  user.refreshTokenHash = refreshTokenHash;
  user.refreshTokenExpiresAt = refreshTokenExpiresAt;
  await user.save();

  return {
    user,
    token: generateAccessToken(user.id),
    refreshToken,
    accessTokenExpiresAt: getAccessTokenExpiryDate().toISOString(),
  };
}

export async function registerUser(payload) {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "An account with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);

  const user = await User.create({
    name: payload.name,
    email: payload.email.toLowerCase(),
    password: passwordHash,
    avatar: payload.avatar,
    phone: payload.phone,
    university: payload.university,
  });

  return issueSession(user);
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password +refreshTokenHash +refreshTokenExpiresAt");
  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password.");
  }

  return issueSession(user);
}

export async function refreshUserSession(refreshToken) {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required.");
  }

  const refreshTokenHash = hashToken(refreshToken);
  const user = await User.findOne({
    refreshTokenHash,
    refreshTokenExpiresAt: { $gt: new Date() },
  }).select("+refreshTokenHash +refreshTokenExpiresAt");

  if (!user) {
    throw new ApiError(401, "Refresh token is invalid or expired.");
  }

  return issueSession(user);
}

export async function revokeUserSession(userId) {
  await User.findByIdAndUpdate(userId, {
    refreshTokenHash: null,
    refreshTokenExpiresAt: null,
  });
}
