import { Response } from "express";
import Course from "../models/Course.model.js";
import User from "../models/User.model.js";
import { AuthedRequest } from "../middlewares/auth.middleware.js";

export async function listPendingCourses(req: AuthedRequest, res: Response) {
  try {
    const items = await Course.find({ status: "Pending" })
      .select(
        "title subtitle description outcomes requirements thumbnailUrl sections category level language price currency status instructorId totalLectures totalVideoSec createdAt rejectionReason"
      )
      .sort({ createdAt: -1 })
      .lean();

    const instructorIds = items.map((x: any) => x.instructorId);
    const instructors = await User.find({ _id: { $in: instructorIds } })
      .select("firstName lastName email")
      .lean();

    const map = new Map<string, any>();
    instructors.forEach((u: any) => map.set(String(u._id), u));

    return res.json({
      items: items.map((c: any) => {
        const u = map.get(String(c.instructorId));
        const name = u ? `${u.firstName} ${u.lastName}`.trim() : "Instructor";
        return {
          id: String(c._id),
          title: c.title,
          subtitle: c.subtitle,
          category: c.category,
          level: c.level,
          language: c.language,
          price: c.price,
          currency: c.currency,
          status: c.status,
          description: c.description,
          outcomes: Array.isArray(c.outcomes) ? c.outcomes : [],
          requirements: Array.isArray(c.requirements) ? c.requirements : [],
          thumbnailUrl: c.thumbnailUrl ?? null,
          sections: Array.isArray(c.sections) ? c.sections : [],
          rejectionReason: c.rejectionReason ?? null,
          instructor: {
            id: String(c.instructorId),
            name,
            email: u?.email || "",
          },
          totalLectures: c.totalLectures || 0,
          totalVideoSec: c.totalVideoSec || 0,
          createdAt: c.createdAt,
        };
      }),
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to load pending courses" });
  }
}

export async function approveCourse(req: AuthedRequest, res: Response) {
  try {
    const id = req.params.id;

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.status !== "Pending") return res.status(400).json({ message: "Course is not pending" });

    course.status = "Published";
    course.rejectionReason = null;
    await course.save();

    return res.json({ message: "Approved" });
  } catch {
    return res.status(400).json({ message: "Invalid id" });
  }
}

export async function rejectCourse(req: AuthedRequest, res: Response) {
  try {
    const id = req.params.id;
    const { reason } = req.body as { reason: string };

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.status !== "Pending") return res.status(400).json({ message: "Course is not pending" });

    if (!reason || String(reason).trim().length < 4) {
      return res.status(400).json({ message: "Reject reason required (min 4 chars)" });
    }

    course.status = "Rejected";
    course.rejectionReason = String(reason).trim();
    await course.save();

    return res.json({ message: "Rejected" });
  } catch {
    return res.status(400).json({ message: "Invalid id" });
  }
}
