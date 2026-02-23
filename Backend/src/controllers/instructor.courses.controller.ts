import { Response } from "express";
import Course from "../models/Course.model.js";
import Quiz from "../models/Quiz.model.js";
import { AuthedRequest } from "../middlewares/auth.middleware.js";

type LessonDraft = {
  title: string;
  type: "Video" | "Note" | "Quiz" | "File";
  durationMin: number;
  isPreview: boolean;
  videoUrl?: string;
  noteText?: string;
  fileUrl?: string;
  resources?: Array<{ name: string; url: string; sizeBytes: number }>;
  quiz?: {
    title?: string;
    passPercent?: number;
    questions: Array<{ q: string; options: string[]; answerIndex: number; explanation?: string }>;
  };
};

type CourseDraft = {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: string;
  language: string;
  subject?: string;

  priceType: "Free" | "Paid";
  priceNpr: number;

  thumbnailUrl?: string;

  outcomes: string[];
  requirements: string[];
  lessons: LessonDraft[];
};

export async function createInstructorCourse(req: AuthedRequest, res: Response) {
  try {
    const instructorId = req.user!.id;

    const { draft } = req.body as { draft: CourseDraft };
    if (!draft) return res.status(400).json({ message: "draft required" });

    // minimal validation
    if (!draft.title || String(draft.title).trim().length < 6) {
      return res.status(400).json({ message: "Course title is too short" });
    }
    if (!draft.description || String(draft.description).trim().length < 30) {
      return res.status(400).json({ message: "Course description is too short" });
    }
    if (!Array.isArray(draft.lessons) || draft.lessons.length < 1) {
      return res.status(400).json({ message: "At least 1 lesson required" });
    }

    // build one section from lessons (simple)
    const lectures: any[] = [];
    let totalVideoSec = 0;

    // create course first (we need courseId for quiz docs)
    const course = await Course.create({
      instructorId,
      title: String(draft.title).trim(),
      subtitle: String(draft.subtitle || "").trim(),
      description: String(draft.description || "").trim(),
      outcomes: Array.isArray(draft.outcomes)
        ? draft.outcomes.map((x) => String(x || "").trim()).filter(Boolean)
        : [],
      requirements: Array.isArray(draft.requirements)
        ? draft.requirements.map((x) => String(x || "").trim()).filter(Boolean)
        : [],

      category: String(draft.category || draft.subject || "").trim(),
      level: String(draft.level || "Beginner").trim(),
      language: String(draft.language || "English").trim(),

      thumbnailUrl: draft.thumbnailUrl || null,

      price: draft.priceType === "Free" ? 0 : Math.max(0, Number(draft.priceNpr || 0)),
      currency: "NPR",

      status: "Pending",
      rejectionReason: null,

      sections: [],

      totalLectures: 0,
      totalVideoSec: 0,
    });

    for (let i = 0; i < draft.lessons.length; i++) {
      const l = draft.lessons[i];
      const type = l.type;

      if (!l.title || String(l.title).trim().length < 3) {
        await Course.findByIdAndDelete(course._id);
        return res.status(400).json({ message: `Lesson ${i + 1} title is too short` });
      }

      // map draft -> lecture
      if (type === "Video") {
        if (!l.videoUrl) {
          await Course.findByIdAndDelete(course._id);
          return res.status(400).json({ message: `Video missing in lesson ${i + 1}` });
        }

        const sec = Math.max(0, Math.round((Number(l.durationMin || 0) * 60) || 0));
        totalVideoSec += sec;

        lectures.push({
          title: String(l.title).trim(),
          type: "video",
          videoUrl: l.videoUrl,
          durationSec: sec,
          isFreePreview: Boolean(l.isPreview),
          order: i,
          resources: Array.isArray(l.resources) ? l.resources : [],
        });
      }

      if (type === "Note") {
        lectures.push({
          title: String(l.title).trim(),
          type: "note",
          noteText: String(l.noteText || ""),
          durationSec: 0,
          isFreePreview: Boolean(l.isPreview),
          order: i,
          resources: Array.isArray(l.resources) ? l.resources : [],
        });
      }

      if (type === "Quiz") {
        const q = l.quiz;
        if (!q || !Array.isArray(q.questions) || q.questions.length < 1) {
          await Course.findByIdAndDelete(course._id);
          return res.status(400).json({ message: `Quiz needs at least 1 question in lesson ${i + 1}` });
        }

        const quizDoc = await Quiz.create({
          courseId: course._id,
          instructorId,
          title: String(q.title || l.title || "Quiz").trim(),
          passPercent: Number(q.passPercent || 60),
          questions: q.questions.map((qq) => ({
            prompt: String(qq.q || "").trim(),
            explanation: String(qq.explanation || ""),
            options: (qq.options || []).map((t, idx) => ({
              text: String(t || ""),
              isCorrect: idx === Number(qq.answerIndex || 0),
            })),
          })),
        });

        lectures.push({
          title: String(l.title).trim(),
          type: "quiz",
          quizId: quizDoc._id,
          durationSec: 0,
          isFreePreview: Boolean(l.isPreview),
          order: i,
          resources: Array.isArray(l.resources) ? l.resources : [],
        });
      }

      if (type === "File") {
        const resources = Array.isArray(l.resources) ? l.resources : [];
        const hasDownload = Boolean(l.fileUrl) || resources.length > 0;

        if (!hasDownload) {
          await Course.findByIdAndDelete(course._id);
          return res.status(400).json({ message: `File missing in lesson ${i + 1}` });
        }

        const normalizedResources =
          resources.length > 0
            ? resources
            : [{ name: String(l.title).trim(), url: String(l.fileUrl), sizeBytes: 0 }];

        lectures.push({
          title: String(l.title).trim(),
          type: "file",
          durationSec: 0,
          isFreePreview: Boolean(l.isPreview),
          order: i,
          resources: normalizedResources,
        });
      }
    }

    course.sections = [
      {
        title: "Curriculum",
        order: 0,
        lectures,
      },
    ] as any;

    course.totalLectures = lectures.length;
    course.totalVideoSec = totalVideoSec;

    await course.save();

    return res.status(201).json({
      item: { id: String(course._id), status: course.status },
      message: "Submitted for admin approval",
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to create course" });
  }
}

export async function listInstructorCourses(req: AuthedRequest, res: Response) {
  try {
    const instructorId = req.user!.id;

    const items = await Course.find({ instructorId })
      .select("title subtitle status rejectionReason createdAt totalLectures totalVideoSec")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      items: items.map((c: any) => ({
        id: String(c._id),
        title: c.title,
        subtitle: c.subtitle,
        status: c.status,
        rejectionReason: c.rejectionReason,
        createdAt: c.createdAt,
        totalLectures: c.totalLectures,
        totalVideoSec: c.totalVideoSec,
      })),
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to load instructor courses" });
  }
}
