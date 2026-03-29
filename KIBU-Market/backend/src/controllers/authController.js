import User from "../models/User.js";
import { registerUser, loginUser } from "../services/authService.js";
import { pick } from "../utils/pick.js";

export async function register(req, res) {
  const { user, token } = await registerUser(req.body);

  res.status(201).json({
    message: "Account created successfully.",
    token,
    user,
    data: user,
  });
}

export async function login(req, res) {
  const { user, token } = await loginUser(req.body);

  res.json({
    message: "Logged in successfully.",
    token,
    user,
    data: user,
  });
}

export async function getCurrentUser(req, res) {
  res.json(req.user);
}

export async function updateCurrentUser(req, res) {
  const updates = pick(req.body, ["name", "avatar", "phone", "university"]);

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({
    message: "Profile updated successfully.",
    user,
    data: user,
  });
}