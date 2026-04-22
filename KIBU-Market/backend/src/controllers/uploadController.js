import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import { persistValidatedImage } from "../services/uploadService.js";
import { buildImageVariants } from "../utils/imageVariants.js";

export async function uploadImage(req, res) {
  const files = [
    ...(req.file ? [req.file] : []),
    ...Object.values(req.files ?? {}).flat(),
  ].slice(0, 3);

  if (files.length === 0) {
    throw new ApiError(400, "Image file is required.");
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const savedFiles = await Promise.all(files.map((file) => persistValidatedImage(file)));
  const uploadedFiles = savedFiles.map((savedFile) => {
    const url = savedFile.url ?? `${baseUrl}/${env.uploadsDir}/${savedFile.filename}`;
    const variants = savedFile.variants ?? buildImageVariants(url);

    return {
      url,
      storage: savedFile.provider,
      variants,
      file: {
        filename: savedFile.filename,
        mimetype: savedFile.mimetype,
        size: savedFile.size,
      },
    };
  });
  const [primaryUpload] = uploadedFiles;

  res.status(201).json({
    message: "Upload successful.",
    url: primaryUpload.url,
    urls: uploadedFiles.map((file) => file.url),
    storage: primaryUpload.storage,
    variants: primaryUpload.variants,
    file: primaryUpload.file,
    files: uploadedFiles.map((file) => file.file),
  });
}
