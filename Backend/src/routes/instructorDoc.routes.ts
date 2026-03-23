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

router.post("/instructor-docs", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const currentUser = (req as any).user;

    const user = await User.findById(currentUser.id).select("role verificationStatus isVerified");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "instructor") return res.status(403).json({ message: "Forbidden" });

    if (user.isVerified || user.verificationStatus === "Verified") {
      return res.status(400).json({ message: "You are already verified" });
    }
    if (user.verificationStatus === "Pending") {
      return res.status(400).json({ message: "Verification is pending. You cannot change documents now." });
    }

    const file = req.file;
    const { docType } = req.body;

    if (!file) return res.status(400).json({ message: "No file uploaded" });
    if (!docType) return res.status(400).json({ message: "docType is required" });

    const isAllowedFile =
      file.mimetype === "application/pdf" || file.mimetype.startsWith("image/");
    if (!isAllowedFile) return res.status(400).json({ message: "Only PDF or image files allowed" });

    const doc = await InstructorDoc.create({
      userId: currentUser.id,
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

router.get("/instructor-docs/me", requireAuth, async (req, res) => {
  try {
    const currentUser = (req as any).user;

    const docs = await InstructorDoc.find({ userId: currentUser.id })
      .sort({ createdAt: -1 })
      .select("_id docType status fileName size createdAt")
      .lean();

    const latestByType: Record<string, any> = {};
    for (const doc of docs) {
      if (!latestByType[doc.docType]) latestByType[doc.docType] = doc;
    }

    return res.json({
      docs: {
        idCard: latestByType.idCard
          ? { id: String(latestByType.idCard._id), status: latestByType.idCard.status, fileName: latestByType.idCard.fileName, createdAt: latestByType.idCard.createdAt }
          : null,
        certificate: latestByType.certificate
          ? { id: String(latestByType.certificate._id), status: latestByType.certificate.status, fileName: latestByType.certificate.fileName, createdAt: latestByType.certificate.createdAt }
          : null,
        experienceLetter: latestByType.experienceLetter
          ? { id: String(latestByType.experienceLetter._id), status: latestByType.experienceLetter.status, fileName: latestByType.experienceLetter.fileName, createdAt: latestByType.experienceLetter.createdAt }
          : null,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to load documents" });
  }
});

router.get("/instructor-docs/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;

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
