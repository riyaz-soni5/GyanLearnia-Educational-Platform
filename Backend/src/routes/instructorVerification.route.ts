// routes/instructorVerification.route.ts
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import User from "../models/User.model.js";
import InstructorDoc from "../models/InstructorDoc.model.js";

const router = Router();

// ✅ GET my current verification status
router.get("/instructor-verification/me", requireAuth, async (req, res) => {
  try {
    const me = (req as any).user;

    const u = await User.findById(me.id).select(
      "role isVerified verificationStatus verificationReason"
    );

    if (!u) return res.status(404).json({ message: "User not found" });
    if (u.role !== "instructor") return res.status(403).json({ message: "Forbidden" });

    // find latest doc submission time
    const latest = await InstructorDoc.findOne({ userId: me.id })
      .sort({ createdAt: -1 })
      .select("createdAt")
      .lean();

    const status = (u.isVerified ? "Verified" : u.verificationStatus) as any;

    return res.json({
      status,
      isVerified: Boolean(u.isVerified),
      reason: u.verificationReason || null,
      submittedAt: latest?.createdAt ? new Date(latest.createdAt).toISOString() : null,
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to load status" });
  }
});

// ✅ POST submit request (moves to Pending)
// IMPORTANT: this is what your frontend is calling after file upload
router.post("/instructor-verification/submit", requireAuth, async (req, res) => {
  try {
    const me = (req as any).user;

    const u = await User.findById(me.id).select("role isVerified verificationStatus");
    if (!u) return res.status(404).json({ message: "User not found" });
    if (u.role !== "instructor") return res.status(403).json({ message: "Forbidden" });

    if (u.isVerified || u.verificationStatus === "Verified") {
      return res.status(400).json({ message: "You are already verified" });
    }

    if (u.verificationStatus === "Pending") {
      return res.status(400).json({ message: "Verification is already pending" });
    }

    // ✅ validate required docs exist
    const docs = await InstructorDoc.find({ userId: me.id }).select("docType status").lean();

    const latestId = await InstructorDoc.findOne({ userId: me.id, docType: "idCard" }).sort({ createdAt: -1 });
    const latestCert = await InstructorDoc.findOne({ userId: me.id, docType: "certificate" }).sort({ createdAt: -1 });

    if (!latestId || !latestCert) {
      return res.status(400).json({ message: "ID Card and Certificate are required" });
    }

    // move status to Pending and clear previous reject msg
    u.verificationStatus = "Pending";
    (u as any).verificationReason = null;
    u.isVerified = false;
    await u.save();

    // mark all docs pending again
    await InstructorDoc.updateMany(
      { userId: me.id },
      { $set: { status: "Pending" } }
    );

    return res.json({ message: "Verification submitted", status: "Pending" });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Submit failed" });
  }
});

export default router;