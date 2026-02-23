import User from "../models/User.model.js";
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export async function listUsers(req, res) {
    try {
        const q = String(req.query.q || "").trim();
        const role = String(req.query.role || "").trim();
        // student | admin | verified_instructor | unverified_instructor (plus instructor optional)
        const page = clamp(parseInt(String(req.query.page || "1"), 10) || 1, 1, 10_000);
        const limit = clamp(parseInt(String(req.query.limit || "10"), 10) || 10, 1, 100);
        const filter = {};
        if (q) {
            filter.$or = [
                { firstName: { $regex: q, $options: "i" } },
                { lastName: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } },
            ];
        }
        // ✅ role filter with verified/unverified instructors
        if (role === "student" || role === "admin") {
            filter.role = role;
        }
        else if (role === "verified_instructor") {
            filter.role = "instructor";
            filter.isVerified = true;
        }
        else if (role === "unverified_instructor") {
            filter.role = "instructor";
            filter.isVerified = { $ne: true };
        }
        else if (role === "instructor") {
            // optional fallback (not used by your UI)
            filter.role = "instructor";
        }
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            User.find(filter)
                .select("_id firstName lastName email role isVerified verificationStatus points acceptedAnswers createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(filter),
        ]);
        return res.json({
            items: items.map((u) => ({
                id: String(u._id),
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
                role: u.role,
                isVerified: Boolean(u.isVerified),
                verificationStatus: u.verificationStatus,
                points: u.points ?? 0,
                acceptedAnswers: u.acceptedAnswers ?? 0,
                joinedAt: u.createdAt,
            })),
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        });
    }
    catch {
        return res.status(500).json({ message: "Failed to fetch users" });
    }
}
export async function deleteUser(req, res) {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select("_id role");
        if (!user)
            return res.status(404).json({ message: "User not found" });
        if (user.role === "admin") {
            return res.status(400).json({ message: "Admin account cannot be deleted" });
        }
        await User.deleteOne({ _id: id });
        return res.json({ message: "User deleted", id });
    }
    catch {
        return res.status(500).json({ message: "Failed to delete user" });
    }
}
// controllers/admin.users.controller.ts
export async function updateUserRole(req, res) {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!role)
            return res.status(400).json({ message: "role is required" });
        const user = await User.findById(id).select("_id role isVerified verificationStatus");
        if (!user)
            return res.status(404).json({ message: "User not found" });
        // protect admin accounts from being modified
        if (user.role === "admin") {
            return res.status(400).json({ message: "Admin account role cannot be changed" });
        }
        // protect self (optional but recommended)
        if (req.user?.id && String(user._id) === String(req.user.id)) {
            return res.status(400).json({ message: "You cannot change your own role" });
        }
        if (role === "student") {
            user.role = "student";
            // keep verification fields as-is (harmless)
        }
        if (role === "admin") {
            user.role = "admin";
            // you may want extra protections here (promotion policy)
        }
        if (role === "verified_instructor") {
            user.role = "instructor";
            user.isVerified = true;
            user.verificationStatus = "Verified";
        }
        if (role === "unverified_instructor") {
            user.role = "instructor";
            user.isVerified = false;
            // if they were verified before, move them off Verified
            if (user.verificationStatus === "Verified") {
                user.verificationStatus = "Pending";
            }
        }
        await user.save();
        return res.json({
            id: String(user._id),
            role: user.role,
            isVerified: Boolean(user.isVerified),
            verificationStatus: user.verificationStatus,
        });
    }
    catch {
        return res.status(500).json({ message: "Failed to update role" });
    }
}
