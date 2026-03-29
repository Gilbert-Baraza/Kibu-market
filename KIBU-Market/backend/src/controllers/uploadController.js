import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

export async function uploadImage(req, res) {
  if (!req.file) {
    throw new ApiError(400, "Image file is required.");
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const url = `${baseUrl}/${env.uploadsDir}/${req.file.filename}`;

  res.status(201).json({
    message: "Upload successful.",
    url,
  });
}