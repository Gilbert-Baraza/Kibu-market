import fs from "fs";
import path from "path";
import multer from "multer";
import env from "../config/env.js";

const uploadsRoot = path.resolve(process.cwd(), env.uploadsDir);

if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsRoot),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const basename = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-");

    cb(null, `${Date.now()}-${basename}${extension}`);
  },
});

function fileFilter(_req, file, cb) {
  if (!file.mimetype.startsWith("image/")) {
    cb(new Error("Only image uploads are allowed."));
    return;
  }

  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});