import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import InstructorDoc from "../models/InstructorDoc.model.js";
import User from "../models/User.model.js";

const router = Router();

router.get("/instructor-verification/me", requireAuth, async (req, res) => {
  try {
    const currentUser = (req as any).user;

    const user = await User.findById(currentUser.id).select(
      "role isVerified verificationStatus verificationReason"
    );

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "instructor") return res.status(403).json({ message: "Forbidden" });

    const latest = await InstructorDoc.findOne({ userId: currentUser.id })
      .sort({ createdAt: -1 })
      .select("createdAt")
      .lean();

    const status = (user.isVerified ? "Verified" : user.verificationStatus) as any;

    return res.json({
      status,
      isVerified: Boolean(user.isVerified),
      reason: user.verificationReason || null,
      submittedAt: latest?.createdAt ? new Date(latest.createdAt).toISOString() : null,
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to load status" });
  }
});

router.post("/instructor-verification/submit", requireAuth, async (req, res) => {
  try {
    const currentUser = (req as any).user;

    const user = await User.findById(currentUser.id).select("role isVerified verificationStatus");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "instructor") return res.status(403).json({ message: "Forbidden" });

    if (user.isVerified || user.verificationStatus === "Verified") {
      return res.status(400).json({ message: "You are already verified" });
    }

    if (user.verificationStatus === "Pending") {
      return res.status(400).json({ message: "Verification is already pending" });
    }

    const latestId = await InstructorDoc.findOne({ userId: currentUser.id, docType: "idCard" }).sort({ createdAt: -1 });
    const latestCert = await InstructorDoc.findOne({ userId: currentUser.id, docType: "certificate" }).sort({ createdAt: -1 });

    if (!latestId || !latestCert) {
      return res.status(400).json({ message: "ID Card and Certificate are required" });
    }

    user.verificationStatus = "Pending";
    (user as any).verificationReason = null;
    user.isVerified = false;
    await user.save();

    await InstructorDoc.updateMany(
      { userId: currentUser.id },
      { $set: { status: "Pending" } }
    );

    return res.json({ message: "Verification submitted", status: "Pending" });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Submit failed" });
  }
});

export default router;
