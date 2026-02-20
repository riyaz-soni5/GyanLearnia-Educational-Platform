// controllers/adminVerification.controller.ts
import { Request, Response } from "express";
import InstructorDoc from "../models/InstructorDoc.model.js";
import User from "../models/User.model.js";

type Status = "Pending" | "Verified" | "Rejected";

const toBool = (v: any) => Boolean(v);

export const listInstructorVerifications = async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    const status = String(req.query.status || "All") as Status | "All";

    // Pull docs + user
    const docs = await InstructorDoc.find({})
      .sort({ createdAt: -1 })
      .populate(
        "userId",
        "firstName lastName email role expertise institution isVerified verificationStatus verificationReason"
        )
      .lean();

    // Group by user
    const map = new Map<string, any>();

    for (const d of docs) {
      const user = d.userId as any;
      if (!user) continue;
      if (user.role !== "instructor") continue;

      const userId = String(user._id);

      if (!map.has(userId)) {
        map.set(userId, {
          id: userId,
          fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Instructor",
          email: user.email,
          expertise: user.expertise ? String(user.expertise).split(",").map((x) => x.trim()).filter(Boolean) : [],
          institute: user.institution || undefined,

          // for UI
          submittedAt: d.createdAt,
          status: (user.verificationStatus || "NotSubmitted") as Status,
          notes: user.verificationReason || undefined,

          docs: {
            idCard: false,
            certificate: false,
            experienceLetter: false,
          },

          // include doc ids so modal can preview/download
          docIds: {
            idCard: undefined as string | undefined,
            certificate: undefined as string | undefined,
            experienceLetter: undefined as string | undefined,
          },
        });
      }

      const row = map.get(userId);

      // track latest submission time
      if (new Date(d.createdAt).getTime() > new Date(row.submittedAt).getTime()) {
        row.submittedAt = d.createdAt;
      }

      // detect docs
      if (d.docType === "idCard") {
        row.docs.idCard = true;
        row.docIds.idCard = String(d._id);
      }
      if (d.docType === "certificate") {
        row.docs.certificate = true;
        row.docIds.certificate = String(d._id);
      }
      if (d.docType === "experienceLetter") {
        row.docs.experienceLetter = true;
        row.docIds.experienceLetter = String(d._id);
      }
    }

    let items = Array.from(map.values());

    // filter by search
    if (q) {
      items = items.filter((x) => {
        const blob = `${x.fullName} ${x.email} ${(x.expertise || []).join(" ")} ${x.institute || ""}`.toLowerCase();
        return blob.includes(q);
      });
    }

    // filter by status
    if (status !== "All") items = items.filter((x) => x.status === status);

    // sort: Pending first, then newest
    const order = { Pending: 0, Rejected: 1, Verified: 2 } as any;
    items.sort((a, b) => {
      const oa = order[a.status] ?? 9;
      const ob = order[b.status] ?? 9;
      if (oa !== ob) return oa - ob;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

    return res.json({ items });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to load verification requests" });
  }
};

export const approveInstructor = async (req: Request, res: Response) => {
  try {
    const instructorId = String(req.params.id);

    const u = await User.findById(instructorId);
    if (!u) return res.status(404).json({ message: "Instructor not found" });

    u.isVerified = true;
    u.verificationStatus = "Verified";
    u.verificationReason = undefined;
    await u.save();

    await InstructorDoc.updateMany(
      { userId: instructorId },
      { $set: { status: "Verified" } }
    );

    return res.json({ message: "Instructor approved" });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Approve failed" });
  }
};

export const rejectInstructor = async (req: Request, res: Response) => {
  try {
    const instructorId = String(req.params.id);
    const { reason } = req.body as { reason?: string };

    const msg = String(reason || "").trim();
    if (!msg) return res.status(400).json({ message: "Reject reason is required" });

    const u = await User.findById(instructorId);
    if (!u) return res.status(404).json({ message: "Instructor not found" });

    u.isVerified = false;
    u.verificationStatus = "Rejected";
    u.verificationReason = msg;
    await u.save();

    await InstructorDoc.updateMany(
      { userId: instructorId },
      { $set: { status: "Rejected" } }
    );

    return res.json({ message: "Instructor rejected" });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Reject failed" });
  }
};