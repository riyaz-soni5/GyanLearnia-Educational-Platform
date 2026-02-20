// middlewares/uploadVerification.middleware.ts
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads", "verification");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "_").replace(/[^\w.\-]/g, "");
    const ext = path.extname(safe) || "";
    const base = path.basename(safe, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ok =
    file.mimetype === "application/pdf" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png";

  if (!ok) return cb(new Error("Only PDF/JPG/PNG files are allowed"));
  cb(null, true);
};

export const uploadVerificationDocs = multer({
  storage,
  fileFilter,
  limits: { fileSize: 6 * 1024 * 1024 }, // 6MB per file
});