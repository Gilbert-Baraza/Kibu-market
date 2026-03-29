import bcrypt from "bcryptjs";
import ApiError from "../utils/ApiError.js";
import User from "../models/User.js";
import { generateToken } from "./tokenService.js";

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

  return {
    user,
    token: generateToken(user.id),
  };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password.");
  }

  return {
    user,
    token: generateToken(user.id),
  };
}