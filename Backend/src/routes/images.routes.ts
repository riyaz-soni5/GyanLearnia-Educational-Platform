import { Router } from "express";
import multer from "multer";
import Image from "../models/Image.model.js";

const router = Router();

// ✅ memory storage -> no upload folder
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit (change if you want)
});

router.post("/images", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No image uploaded" });

    // basic type check
    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({ message: "Only image files allowed" });
    }

    const doc = await Image.create({
      data: file.buffer,
      contentType: file.mimetype,
      fileName: file.originalname,
      size: file.size,
    });

    return res.json({
      id: doc._id,
      url: `/api/images/${doc._id}`, // frontend will use this
    });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message || "Upload failed" });
  }
});

router.get("/images/:id", async (req, res) => {
  try {
    const img = await Image.findById(req.params.id).select("data contentType");
    if (!img) return res.status(404).send("Not found");

    res.set("Content-Type", img.contentType);
    // ✅ caching helps a lot
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(img.data);
  } catch {
    return res.status(400).send("Invalid id");
  }
});

export default router;