import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadImage } from "../controllers/uploadController.js";
import { normalizeUploadError, upload } from "../services/uploadService.js";

const router = Router();

router.post("/", requireAuth, (req, res, next) => {
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "files", maxCount: 3 },
  ])(req, res, (error) => {
    if (error) {
      next(normalizeUploadError(error));
      return;
    }

    asyncHandler(uploadImage)(req, res, next);
  });
});

export default router;
