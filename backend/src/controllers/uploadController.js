import ApiError from "../utils/ApiError.js";
import { collectUploadedFiles, persistValidatedImage } from "../services/uploadService.js";
import { buildImageVariants } from "../utils/imageVariants.js";

export async function uploadImage(req, res) {
  const files = collectUploadedFiles(req);

  if (files.length === 0) {
    throw new ApiError(400, "Image file is required.");
  }

  const savedFiles = await Promise.all(files.map((file) => persistValidatedImage(file)));
  const uploadedFiles = savedFiles.map((savedFile) => {
    const url = savedFile.url;

    if (!url) {
      throw new ApiError(502, "Cloudinary upload did not return an image URL.");
    }

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
