import bcrypt from "bcryptjs";
import User from "../models/User.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Certificate from "../models/Certification.model.js";
function sanitizeInterests(values) {
    if (!Array.isArray(values))
        return [];
    const unique = new Map();
    for (const value of values) {
        const trimmed = String(value ?? "").trim();
        if (!trimmed)
            continue;
        const key = trimmed.toLocaleLowerCase();
        if (!unique.has(key))
            unique.set(key, trimmed);
    }
    return Array.from(unique.values());
}
export async function getCurrentUser(req, res) {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await User.findById(req.user.id).lean();
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const [enrollmentAgg, completedAgg, certificatesCount] = await Promise.all([
            Enrollment.countDocuments({ userId: user._id }),
            Enrollment.countDocuments({ userId: user._id, completedAt: { $ne: null } }),
            Certificate.countDocuments({ userId: user._id }),
        ]);
        const enrollments = await Enrollment.find({ userId: user._id })
            .select("courseId completedAt")
            .populate("courseId", "title thumbnailUrl status")
            .lean();
        const enrolledCourses = enrollments
            .map((e) => e.courseId)
            .filter((c) => c && c.status === "Published")
            .map((c) => ({
            id: String(c._id),
            title: c.title,
            thumbnailUrl: c.thumbnailUrl,
        }));
        const completedCourses = enrollments
            .filter((e) => e.completedAt && e.courseId && e.courseId.status === "Published")
            .map((e) => e.courseId)
            .map((c) => ({
            id: String(c._id),
            title: c.title,
            thumbnailUrl: c.thumbnailUrl,
        }));
        const points = Number(user.points ?? 0);
        let badge = "New Learner";
        if (points >= 1000)
            badge = "Legend";
        else if (points >= 500)
            badge = "Top Performer";
        else if (points >= 100)
            badge = "Active Learner";
        return res.json({
            id: String(user._id),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            dateOfBirth: user.dateOfBirth ?? null,
            gender: user.gender ?? "",
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            interests: sanitizeInterests(user.interests),
            academicBackgrounds: Array.isArray(user.academicBackgrounds)
                ? user.academicBackgrounds.map((item) => ({
                    institution: item.institution,
                    startDate: item.startDate,
                    endDate: item.endDate,
                    isCurrent: Boolean(item.isCurrent),
                }))
                : [],
            socialLinks: {
                linkedin: user.socialLinks?.linkedin || "",
                twitter: user.socialLinks?.twitter || "",
                facebook: user.socialLinks?.facebook || "",
                instagram: user.socialLinks?.instagram || "",
                website: user.socialLinks?.website || "",
            },
            expertise: user.expertise,
            institution: user.institution,
            isVerified: Boolean(user.isVerified),
            verificationStatus: user.verificationStatus,
            stats: {
                enrolledCoursesCount: enrollmentAgg,
                completedCoursesCount: completedAgg,
                certificatesCount,
                points,
                badge,
                enrolledCourses,
                completedCourses,
            },
        });
    }
    catch {
        return res.status(500).json({ message: "Failed to load profile" });
    }
}
export async function updateCurrentUser(req, res) {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { firstName, lastName, dateOfBirth, gender, bio, academicBackgrounds, avatarUrl, socialLinks, expertise, institution, interests, } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const trimmedFirstName = String(firstName ?? "").trim();
        const trimmedLastName = String(lastName ?? "").trim();
        if (!trimmedFirstName || !trimmedLastName) {
            return res.status(400).json({ message: "First name and last name are required" });
        }
        user.firstName = trimmedFirstName;
        user.lastName = trimmedLastName;
        if (dateOfBirth === null || String(dateOfBirth ?? "").trim() === "") {
            user.dateOfBirth = null;
        }
        else {
            const parsedDob = new Date(String(dateOfBirth));
            if (Number.isNaN(parsedDob.getTime())) {
                return res.status(400).json({ message: "Invalid date of birth" });
            }
            user.dateOfBirth = parsedDob;
        }
        if (gender === null || String(gender ?? "").trim() === "") {
            user.gender = "";
        }
        else {
            const normalizedGender = String(gender).trim();
            const allowedGenders = ["male", "female", "other", "prefer_not_to_say"];
            if (!allowedGenders.includes(normalizedGender)) {
                return res.status(400).json({ message: "Invalid gender value" });
            }
            user.gender = normalizedGender;
        }
        if (user.role === "instructor") {
            user.expertise = String(expertise ?? "").trim() || undefined;
            user.institution = String(institution ?? "").trim() || undefined;
        }
        user.bio = String(bio ?? "").trim();
        if (Array.isArray(academicBackgrounds)) {
            user.academicBackgrounds = academicBackgrounds
                .filter((item) => item && item.institution && item.startDate)
                .map((item) => ({
                institution: String(item.institution).trim(),
                startDate: new Date(item.startDate),
                endDate: item.isCurrent ? null : item.endDate ? new Date(item.endDate) : null,
                isCurrent: Boolean(item.isCurrent),
            }));
        }
        if (socialLinks && typeof socialLinks === "object") {
            user.socialLinks = {
                linkedin: String(socialLinks.linkedin ?? user.socialLinks?.linkedin ?? "").trim(),
                twitter: String(socialLinks.twitter ?? user.socialLinks?.twitter ?? "").trim(),
                facebook: String(socialLinks.facebook ?? user.socialLinks?.facebook ?? "").trim(),
                instagram: String(socialLinks.instagram ?? user.socialLinks?.instagram ?? "").trim(),
                website: String(socialLinks.website ?? user.socialLinks?.website ?? "").trim(),
            };
        }
        if (Array.isArray(interests)) {
            user.interests = sanitizeInterests(interests);
        }
        user.avatarUrl = String(avatarUrl ?? "").trim() || null;
        await user.save();
        return res.json({
            id: String(user._id),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            dateOfBirth: user.dateOfBirth ?? null,
            gender: user.gender ?? "",
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            interests: sanitizeInterests(user.interests),
            academicBackgrounds: Array.isArray(user.academicBackgrounds)
                ? user.academicBackgrounds.map((item) => ({
                    institution: item.institution,
                    startDate: item.startDate,
                    endDate: item.endDate,
                    isCurrent: Boolean(item.isCurrent),
                }))
                : [],
            socialLinks: {
                linkedin: user.socialLinks?.linkedin || "",
                twitter: user.socialLinks?.twitter || "",
                facebook: user.socialLinks?.facebook || "",
                instagram: user.socialLinks?.instagram || "",
                website: user.socialLinks?.website || "",
            },
            expertise: user.expertise,
            institution: user.institution,
            isVerified: Boolean(user.isVerified),
            verificationStatus: user.verificationStatus,
        });
    }
    catch {
        return res.status(500).json({ message: "Failed to update profile" });
    }
}
export async function changePassword(req, res) {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new password are required" });
        }
        if (String(newPassword).trim().length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }
        const user = await User.findById(req.user.id).select("password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const ok = await bcrypt.compare(String(currentPassword), user.password);
        if (!ok) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }
        user.password = await bcrypt.hash(String(newPassword), 10);
        await user.save();
        return res.json({ message: "Password updated successfully" });
    }
    catch {
        return res.status(500).json({ message: "Failed to update password" });
    }
}
