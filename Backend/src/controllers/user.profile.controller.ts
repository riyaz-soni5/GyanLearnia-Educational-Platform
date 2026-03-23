import type { Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Answer from "../models/Answer.model.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";

function sanitizeInterests(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const unique = new Map<string, string>();
  for (const value of values) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) continue;
    const key = trimmed.toLocaleLowerCase();
    if (!unique.has(key)) unique.set(key, trimmed);
  }
  return Array.from(unique.values());
}

type UserPlanSnapshot = {
  currentPlan: "Free" | "Pro";
  planStatus: "Active" | "Expired";
  planActivatedAt: Date | null;
  planExpiresAt: Date | null;
};

const getUserPlanSnapshot = (user: any): UserPlanSnapshot => {
  const rawPlan = String(user?.plan ?? "Free") === "Pro" ? "Pro" : "Free";
  const rawExpiry = user?.planExpiresAt ? new Date(user.planExpiresAt) : null;
  const expiryValid = rawExpiry && !Number.isNaN(rawExpiry.getTime()) ? rawExpiry : null;
  const isExpired = rawPlan === "Pro" && !!expiryValid && expiryValid.getTime() < Date.now();

  return {
    currentPlan: isExpired ? "Free" : rawPlan,
    planStatus: isExpired ? "Expired" : "Active",
    planActivatedAt: user?.planActivatedAt ? new Date(user.planActivatedAt) : null,
    planExpiresAt: expiryValid,
  };
};

const ACCEPT_POINTS = 15;

function formatMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export async function getCurrentUser(req: AuthedRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [enrollmentAgg, completedAgg, acceptedAnswerEvents] = await Promise.all([
      Enrollment.countDocuments({ userId: user._id }),
      Enrollment.countDocuments({ userId: user._id, completedAt: { $ne: null } }),
      Answer.find({ authorId: user._id, isVerified: true })
        .select("createdAt")
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    const enrollments = await Enrollment.find({ userId: user._id })
      .select("courseId completedAt")
      .populate("courseId", "title thumbnailUrl status certificate.enabled")
      .lean();

    const enrolledCourses = enrollments
      .map((e: any) => e.courseId)
      .filter((c: any) => c && c.status === "Published")
      .map((c: any) => ({
        id: String(c._id),
        title: c.title,
        thumbnailUrl: c.thumbnailUrl,
      }));

    const completedCourses = enrollments
      .filter((e: any) => e.completedAt && e.courseId && (e.courseId as any).status === "Published")
      .map((e: any) => e.courseId)
      .map((c: any) => ({
        id: String(c._id),
        title: c.title,
        thumbnailUrl: c.thumbnailUrl,
      }));

    const certificatesCount = enrollments.filter(
      (e: any) =>
        Boolean(e?.completedAt) &&
        Boolean(e?.courseId) &&
        String((e.courseId as any)?.status || "") === "Published" &&
        Boolean((e.courseId as any)?.certificate?.enabled)
    ).length;

    const points = Number((user as any).points ?? 0);
    const now = new Date();
    const userCreatedAt = (user as any).createdAt ? new Date((user as any).createdAt) : now;
    const timelineStart = Number.isNaN(userCreatedAt.getTime()) ? now : userCreatedAt;
    const timelineEnd = now;
    const monthlyIncrements = new Map<string, number>();

    for (const item of acceptedAnswerEvents as Array<{ createdAt?: Date | string }>) {
      if (!item?.createdAt) continue;
      const eventDate = new Date(item.createdAt);
      if (Number.isNaN(eventDate.getTime())) continue;
      const key = formatMonthKey(eventDate);
      monthlyIncrements.set(key, (monthlyIncrements.get(key) ?? 0) + ACCEPT_POINTS);
    }

    const pointsTimeline: Array<{ label: string; date: string; points: number }> = [];
    let cursor = new Date(Date.UTC(timelineStart.getUTCFullYear(), timelineStart.getUTCMonth(), 1));
    const endCursor = new Date(Date.UTC(timelineEnd.getUTCFullYear(), timelineEnd.getUTCMonth(), 1));
    let runningPoints = 0;

    while (cursor.getTime() <= endCursor.getTime()) {
      const key = formatMonthKey(cursor);
      runningPoints += monthlyIncrements.get(key) ?? 0;
      pointsTimeline.push({
        label: formatMonthLabel(cursor),
        date: new Date(cursor).toISOString(),
        points: runningPoints,
      });
      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    }

    if (pointsTimeline.length === 0) {
      pointsTimeline.push({
        label: formatMonthLabel(now),
        date: now.toISOString(),
        points: 0,
      });
    }

    pointsTimeline[pointsTimeline.length - 1].points = Math.max(0, points);

    let badge: "New Learner" | "Active Learner" | "Top Performer" | "Legend" = "New Learner";
    if (points >= 1000) badge = "Legend";
    else if (points >= 500) badge = "Top Performer";
    else if (points >= 100) badge = "Active Learner";

    const plan = getUserPlanSnapshot(user);
    const walletBalancePaisa = Number((user as any).walletBalancePaisa ?? 0);
    const walletBalance = Number((walletBalancePaisa / 100).toFixed(2));

    return res.json({
      id: String(user._id),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      dateOfBirth: (user as any).dateOfBirth ?? null,
      gender: (user as any).gender ?? "",
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      interests: sanitizeInterests((user as any).interests),
      academicBackgrounds: Array.isArray((user as any).academicBackgrounds)
        ? (user as any).academicBackgrounds.map((item: any) => ({
            institution: item.institution,
            startDate: item.startDate,
            endDate: item.endDate,
            isCurrent: Boolean(item.isCurrent),
          }))
        : [],
      socialLinks: {
        linkedin: (user as any).socialLinks?.linkedin || "",
        twitter: (user as any).socialLinks?.twitter || "",
        facebook: (user as any).socialLinks?.facebook || "",
        instagram: (user as any).socialLinks?.instagram || "",
        website: (user as any).socialLinks?.website || "",
      },
      expertise: user.expertise,
      institution: user.institution,
      isVerified: Boolean(user.isVerified),
      verificationStatus: user.verificationStatus,
      currentPlan: plan.currentPlan,
      planStatus: plan.planStatus,
      planActivatedAt: plan.planActivatedAt,
      planExpiresAt: plan.planExpiresAt,
      walletBalancePaisa,
      walletBalance,
      stats: {
        enrolledCoursesCount: enrollmentAgg,
        completedCoursesCount: completedAgg,
        certificatesCount,
        points,
        badge,
        enrolledCourses,
        completedCourses,
        pointsTimeline,
      },
    });
  } catch {
    return res.status(500).json({ message: "Failed to load profile" });
  }
}

export async function updateCurrentUser(req: AuthedRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      bio,
      academicBackgrounds,
      avatarUrl,
      socialLinks,
      expertise,
      institution,
      interests,
    } = req.body as {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string | null;
      gender?: "" | "male" | "female" | "other" | "prefer_not_to_say" | null;
      email?: string;
      bio?: string;
      academicBackgrounds?: Array<{
        institution: string;
        startDate: string;
        endDate?: string | null;
        isCurrent?: boolean;
      }>;
      avatarUrl?: string;
      socialLinks?: {
        linkedin?: string;
        twitter?: string;
        facebook?: string;
        instagram?: string;
        website?: string;
      };
      expertise?: string;
      institution?: string;
      interests?: string[];
    };

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
      (user as any).dateOfBirth = null;
    } else {
      const parsedDob = new Date(String(dateOfBirth));
      if (Number.isNaN(parsedDob.getTime())) {
        return res.status(400).json({ message: "Invalid date of birth" });
      }
      (user as any).dateOfBirth = parsedDob;
    }

    if (gender === null || String(gender ?? "").trim() === "") {
      (user as any).gender = "";
    } else {
      const normalizedGender = String(gender).trim();
      const allowedGenders = ["male", "female", "other", "prefer_not_to_say"];
      if (!allowedGenders.includes(normalizedGender)) {
        return res.status(400).json({ message: "Invalid gender value" });
      }
      (user as any).gender = normalizedGender;
    }

    if (user.role === "instructor") {
      user.expertise = String(expertise ?? "").trim() || undefined;
      user.institution = String(institution ?? "").trim() || undefined;
    }

    user.bio = String(bio ?? "").trim();

    if (Array.isArray(academicBackgrounds)) {
      (user as any).academicBackgrounds = academicBackgrounds
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
      (user as any).interests = sanitizeInterests(interests);
    }
    user.avatarUrl = String(avatarUrl ?? "").trim() || null;

    await user.save();

    const plan = getUserPlanSnapshot(user);
    const walletBalancePaisa = Number((user as any).walletBalancePaisa ?? 0);
    const walletBalance = Number((walletBalancePaisa / 100).toFixed(2));

    return res.json({
      id: String(user._id),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      dateOfBirth: (user as any).dateOfBirth ?? null,
      gender: (user as any).gender ?? "",
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      interests: sanitizeInterests((user as any).interests),
      academicBackgrounds: Array.isArray((user as any).academicBackgrounds)
        ? (user as any).academicBackgrounds.map((item: any) => ({
            institution: item.institution,
            startDate: item.startDate,
            endDate: item.endDate,
            isCurrent: Boolean(item.isCurrent),
          }))
        : [],
      socialLinks: {
        linkedin: (user as any).socialLinks?.linkedin || "",
        twitter: (user as any).socialLinks?.twitter || "",
        facebook: (user as any).socialLinks?.facebook || "",
        instagram: (user as any).socialLinks?.instagram || "",
        website: (user as any).socialLinks?.website || "",
      },
      expertise: user.expertise,
      institution: user.institution,
      isVerified: Boolean(user.isVerified),
      verificationStatus: user.verificationStatus,
      currentPlan: plan.currentPlan,
      planStatus: plan.planStatus,
      planActivatedAt: plan.planActivatedAt,
      planExpiresAt: plan.planExpiresAt,
      walletBalancePaisa,
      walletBalance,
    });
  } catch {
    return res.status(500).json({ message: "Failed to update profile" });
  }
}

export async function changePassword(req: AuthedRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

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
  } catch {
    return res.status(500).json({ message: "Failed to update password" });
  }
}
