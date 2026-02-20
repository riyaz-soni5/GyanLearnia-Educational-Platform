import { Router } from "express";
import multer from "multer";
import mongoose from "mongoose";
import InstructorDoc from "../models/InstructorDoc.model.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import User from "../models/User.model.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// instructor uploads a doc
router.post("/instructor-docs", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const me = (req as any).user;

    const u = await User.findById(me.id).select("role verificationStatus isVerified");
    if (!u) return res.status(404).json({ message: "User not found" });
    if (u.role !== "instructor") return res.status(403).json({ message: "Forbidden" });

    if (u.isVerified || u.verificationStatus === "Verified") {
      return res.status(400).json({ message: "You are already verified" });
    }
    if (u.verificationStatus === "Pending") {
      return res.status(400).json({ message: "Verification is pending. You cannot change documents now." });
    }

    const file = req.file;
    const { docType } = req.body;

    if (!file) return res.status(400).json({ message: "No file uploaded" });
    if (!docType) return res.status(400).json({ message: "docType is required" });

    const ok = file.mimetype === "application/pdf" || file.mimetype.startsWith("image/");
    if (!ok) return res.status(400).json({ message: "Only PDF or image files allowed" });

    const doc = await InstructorDoc.create({
      userId: me.id,
      docType,
      data: file.buffer,
      contentType: file.mimetype,
      fileName: file.originalname,
      size: file.size,
      status: "Pending",
    });

    return res.json({
      id: doc._id,
      url: `/api/instructor-docs/${doc._id}`,
      status: doc.status,
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Upload failed" });
  }
});


// ✅ IMPORTANT: put /me BEFORE /:id
router.get("/instructor-docs/me", requireAuth, async (req, res) => {
  try {
    const me = (req as any).user;

    const docs = await InstructorDoc.find({ userId: me.id })
      .sort({ createdAt: -1 })
      .select("_id docType status fileName size createdAt")
      .lean();

    const latest: Record<string, any> = {};
    for (const d of docs) {
      if (!latest[d.docType]) latest[d.docType] = d;
    }

    return res.json({
      docs: {
        idCard: latest.idCard
          ? { id: String(latest.idCard._id), status: latest.idCard.status, fileName: latest.idCard.fileName, createdAt: latest.idCard.createdAt }
          : null,
        certificate: latest.certificate
          ? { id: String(latest.certificate._id), status: latest.certificate.status, fileName: latest.certificate.fileName, createdAt: latest.certificate.createdAt }
          : null,
        experienceLetter: latest.experienceLetter
          ? { id: String(latest.experienceLetter._id), status: latest.experienceLetter.status, fileName: latest.experienceLetter.fileName, createdAt: latest.experienceLetter.createdAt }
          : null,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to load documents" });
  }
});


// fetch a doc (admin or owner later)
router.get("/instructor-docs/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;

    // ✅ safer: avoid "Invalid id" noise
    if (!mongoose.isValidObjectId(id)) return res.status(400).send("Invalid id");

    const doc = await InstructorDoc.findById(id).select("data contentType");
    if (!doc) return res.status(404).send("Not found");

    res.set("Content-Type", doc.contentType);
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(doc.data);
  } catch {
    return res.status(400).send("Invalid id");
  }
});

export default router;