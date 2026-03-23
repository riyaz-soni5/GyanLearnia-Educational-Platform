import Course from "../models/Course.model.js";
import User from "../models/User.model.js";
async function buildAdminCourseRows(filter) {
    const items = await Course.find(filter)
        .select("title subtitle description outcomes requirements thumbnailUrl sections category level language price currency status instructorId totalLectures totalVideoSec createdAt rejectionReason")
        .sort({ createdAt: -1 })
        .lean();
    const instructorIds = items.map((item) => item.instructorId);
    const instructors = await User.find({ _id: { $in: instructorIds } })
        .select("firstName lastName email")
        .lean();
    const instructorMap = new Map();
    instructors.forEach((user) => instructorMap.set(String(user._id), user));
    return items.map((course) => {
        const instructor = instructorMap.get(String(course.instructorId));
        const name = instructor ? `${instructor.firstName} ${instructor.lastName}`.trim() : "Instructor";
        return {
            id: String(course._id),
            title: course.title,
            subtitle: course.subtitle,
            category: course.category,
            level: course.level,
            language: course.language,
            price: course.price,
            currency: course.currency,
            status: course.status,
            description: course.description,
            outcomes: Array.isArray(course.outcomes) ? course.outcomes : [],
            requirements: Array.isArray(course.requirements) ? course.requirements : [],
            thumbnailUrl: course.thumbnailUrl ?? null,
            sections: Array.isArray(course.sections) ? course.sections : [],
            rejectionReason: course.rejectionReason ?? null,
            instructor: {
                id: String(course.instructorId),
                name,
                email: instructor?.email || "",
            },
            totalLectures: course.totalLectures || 0,
            totalVideoSec: course.totalVideoSec || 0,
            createdAt: course.createdAt,
        };
    });
}
export async function listAdminCourses(req, res) {
    try {
        const status = typeof req.query.status === "string" ? req.query.status : "All";
        const filter = status && status !== "All" ? { status } : {};
        const items = await buildAdminCourseRows(filter);
        return res.json({ items });
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Failed to load courses",
        });
    }
}
export async function listPendingCourses(_req, res) {
    try {
        const items = await buildAdminCourseRows({ status: "Pending" });
        return res.json({ items });
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Failed to load pending courses",
        });
    }
}
export async function approveCourse(req, res) {
    try {
        const id = req.params.id;
        const course = await Course.findById(id);
        if (!course)
            return res.status(404).json({ message: "Course not found" });
        if (course.status !== "Pending")
            return res.status(400).json({ message: "Course is not pending" });
        course.status = "Published";
        course.rejectionReason = null;
        await course.save();
        return res.json({ message: "Approved" });
    }
    catch {
        return res.status(400).json({ message: "Invalid id" });
    }
}
export async function rejectCourse(req, res) {
    try {
        const id = req.params.id;
        const { reason } = req.body;
        const course = await Course.findById(id);
        if (!course)
            return res.status(404).json({ message: "Course not found" });
        if (course.status !== "Pending")
            return res.status(400).json({ message: "Course is not pending" });
        if (!reason || String(reason).trim().length < 4) {
            return res.status(400).json({ message: "Reject reason required (min 4 chars)" });
        }
        course.status = "Rejected";
        course.rejectionReason = String(reason).trim();
        await course.save();
        return res.json({ message: "Rejected" });
    }
    catch {
        return res.status(400).json({ message: "Invalid id" });
    }
}
