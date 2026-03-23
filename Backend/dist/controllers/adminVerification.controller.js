import InstructorDoc from "../models/InstructorDoc.model.js";
import User from "../models/User.model.js";
import { createNotification } from "../services/notification.service.js";
const statusOrder = { Pending: 0, Rejected: 1, Verified: 2 };
export const listInstructorVerifications = async (req, res) => {
    try {
        const q = String(req.query.q || "").trim().toLowerCase();
        const status = String(req.query.status || "All");
        const docs = await InstructorDoc.find({})
            .sort({ createdAt: -1 })
            .populate("userId", "firstName lastName email role expertise institution isVerified verificationStatus verificationReason")
            .lean();
        const userMap = new Map();
        for (const doc of docs) {
            const user = doc.userId;
            if (!user)
                continue;
            if (user.role !== "instructor")
                continue;
            const userId = String(user._id);
            if (!userMap.has(userId)) {
                userMap.set(userId, {
                    id: userId,
                    fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Instructor",
                    email: user.email,
                    expertise: user.expertise ? String(user.expertise).split(",").map((x) => x.trim()).filter(Boolean) : [],
                    institute: user.institution || undefined,
                    submittedAt: doc.createdAt,
                    status: (user.verificationStatus || "NotSubmitted"),
                    notes: user.verificationReason || undefined,
                    docs: {
                        idCard: false,
                        certificate: false,
                        experienceLetter: false,
                    },
                    docIds: {
                        idCard: undefined,
                        certificate: undefined,
                        experienceLetter: undefined,
                    },
                });
            }
            const row = userMap.get(userId);
            if (new Date(doc.createdAt).getTime() > new Date(row.submittedAt).getTime()) {
                row.submittedAt = doc.createdAt;
            }
            if (doc.docType === "idCard") {
                row.docs.idCard = true;
                row.docIds.idCard = String(doc._id);
            }
            if (doc.docType === "certificate") {
                row.docs.certificate = true;
                row.docIds.certificate = String(doc._id);
            }
            if (doc.docType === "experienceLetter") {
                row.docs.experienceLetter = true;
                row.docIds.experienceLetter = String(doc._id);
            }
        }
        let items = Array.from(userMap.values());
        if (q) {
            items = items.filter((x) => {
                const blob = `${x.fullName} ${x.email} ${(x.expertise || []).join(" ")} ${x.institute || ""}`.toLowerCase();
                return blob.includes(q);
            });
        }
        if (status !== "All")
            items = items.filter((x) => x.status === status);
        items.sort((a, b) => {
            const oa = statusOrder[a.status] ?? 9;
            const ob = statusOrder[b.status] ?? 9;
            if (oa !== ob)
                return oa - ob;
            return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        });
        return res.json({ items });
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Failed to load verification requests",
        });
    }
};
export const approveInstructor = async (req, res) => {
    try {
        const authedReq = req;
        const actorId = String(authedReq.user?.id || "").trim();
        const instructorId = String(req.params.id);
        const user = await User.findById(instructorId);
        if (!user)
            return res.status(404).json({ message: "Instructor not found" });
        user.isVerified = true;
        user.verificationStatus = "Verified";
        user.verificationReason = undefined;
        await user.save();
        await InstructorDoc.updateMany({ userId: instructorId }, { $set: { status: "Verified" } });
        await createNotification({
            userId: instructorId,
            actorId: actorId || undefined,
            type: "instructor_verified",
            title: "Instructor verification approved",
            message: "Your instructor profile is now verified. You can publish courses and access instructor features.",
            link: "/instructor/dashboard",
            metadata: { instructorId },
        });
        return res.json({ message: "Instructor approved" });
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Approve failed",
        });
    }
};
export const rejectInstructor = async (req, res) => {
    try {
        const authedReq = req;
        const actorId = String(authedReq.user?.id || "").trim();
        const instructorId = String(req.params.id);
        const { reason } = req.body;
        const msg = String(reason || "").trim();
        if (!msg)
            return res.status(400).json({ message: "Reject reason is required" });
        const user = await User.findById(instructorId);
        if (!user)
            return res.status(404).json({ message: "Instructor not found" });
        user.isVerified = false;
        user.verificationStatus = "Rejected";
        user.verificationReason = msg;
        await user.save();
        await InstructorDoc.updateMany({ userId: instructorId }, { $set: { status: "Rejected" } });
        await createNotification({
            userId: instructorId,
            actorId: actorId || undefined,
            type: "instructor_rejected",
            title: "Instructor verification rejected",
            message: `Your verification request was rejected. Reason: ${msg}`.slice(0, 500),
            link: "/instructor/verify",
            metadata: { instructorId, reason: msg },
        });
        return res.json({ message: "Instructor rejected" });
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Reject failed",
        });
    }
};
