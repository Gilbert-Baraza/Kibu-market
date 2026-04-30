import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadImage } from "../controllers/uploadController.js";
import { runImageUploadMiddleware } from "../services/uploadService.js";

const router = Router();

router.post("/", requireAuth, runImageUploadMiddleware, asyncHandler(uploadImage));

export default router;
