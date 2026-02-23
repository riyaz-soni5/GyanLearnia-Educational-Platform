import { Response } from "express";
import Course from "../models/Course.model.js";
import Quiz from "../models/Quiz.model.js";
import { AuthedRequest } from "../middlewares/auth.middleware.js";

type LessonDraft = {
  title: string;
  type: "Video" | "Quiz" | "File";
  durationMin: number;
  isPreview: boolean;
  videoUrl?: string;
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
  tags?: string[];
  sections?: Array<{
    title: string;
    lessons: LessonDraft[];
  }>;
  lessons?: LessonDraft[]; // legacy fallback
};

type PreparedQuizQuestion = {
  q: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

type PreparedLesson =
  | {
      kind: "video";
      title: string;
      isPreview: boolean;
      durationSec: number;
      videoUrl: string;
    }
  | {
      kind: "file";
      title: string;
      isPreview: boolean;
      resources: Array<{ name: string; url: string; sizeBytes: number }>;
    }
  | {
      kind: "quiz";
      title: string;
      isPreview: boolean;
      quiz: {
        title: string;
        passPercent: number;
        questions: PreparedQuizQuestion[];
      };
    };

type PreparedSection = {
  title: string;
  lessons: PreparedLesson[];
};

type BuiltSectionsResult = {
  sections: any[];
  totalLectures: number;
  totalVideoSec: number;
  createdQuizIds: string[];
};

class DraftValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DraftValidationError";
  }
}

const KNOWN_CATEGORIES = new Set(["Academic", "Technical", "Vocational", "Skill"]);
const KNOWN_SUBJECTS = new Set([
  "Mathematics",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Nepali",
  "Accountancy",
  "Economics",
  "Computer Science",
  "Business Studies",
  "Other",
]);

function normalizeDraftSections(draft: CourseDraft) {
  const normalizedSections =
    Array.isArray(draft.sections) && draft.sections.length > 0
      ? draft.sections
      : [
          {
            title: "Curriculum",
            lessons: Array.isArray(draft.lessons) ? draft.lessons : [],
          },
        ];

  const hasAnyLesson = normalizedSections.some((s) => Array.isArray(s.lessons) && s.lessons.length > 0);
  if (!hasAnyLesson) {
    throw new DraftValidationError("At least 1 section with 1 lesson required");
  }

  return normalizedSections;
}

function validateBaseDraft(draft: CourseDraft) {
  if (!draft.title || String(draft.title).trim().length < 6) {
    throw new DraftValidationError("Course title is too short");
  }

  if (!draft.description || String(draft.description).trim().length < 30) {
    throw new DraftValidationError("Course description is too short");
  }

  normalizeDraftSections(draft);
}

function prepareSectionsFromDraft(draft: CourseDraft): PreparedSection[] {
  const normalizedSections = normalizeDraftSections(draft);
  const preparedSections: PreparedSection[] = [];

  for (let sectionIdx = 0; sectionIdx < normalizedSections.length; sectionIdx++) {
    const section = normalizedSections[sectionIdx];
    const sectionTitle = String(section.title || "").trim() || `Section ${sectionIdx + 1}`;
    const lessons = Array.isArray(section.lessons) ? section.lessons : [];

    if (lessons.length < 1) continue;

    const preparedLessons: PreparedLesson[] = [];

    for (let i = 0; i < lessons.length; i++) {
      const l = lessons[i];
      const type = l.type;
      const lessonTitle = String(l.title || "").trim();

      if (lessonTitle.length < 3) {
        throw new DraftValidationError(`Lesson ${i + 1} title is too short in ${sectionTitle}`);
      }

      if (type === "Video") {
        if (!l.videoUrl) {
          throw new DraftValidationError(`Video missing in lesson ${i + 1} (${sectionTitle})`);
        }

        preparedLessons.push({
          kind: "video",
          title: lessonTitle,
          isPreview: Boolean(l.isPreview),
          videoUrl: String(l.videoUrl),
          durationSec: Math.max(0, Math.round((Number(l.durationMin || 0) * 60) || 0)),
        });
        continue;
      }

      if (type === "Quiz") {
        const q = l.quiz;
        if (!q || !Array.isArray(q.questions) || q.questions.length < 1) {
          throw new DraftValidationError(`Quiz needs at least 1 question in lesson ${i + 1} (${sectionTitle})`);
        }

        const preparedQuestions: PreparedQuizQuestion[] = [];

        for (let qi = 0; qi < q.questions.length; qi++) {
          const qq = q.questions[qi];
          const prompt = String(qq.q ?? "").trim();
          const options = Array.isArray(qq.options) ? qq.options.map((x) => String(x ?? "").trim()) : [];
          const answerIndex = Number(qq.answerIndex);

          if (prompt.length < 3) {
            throw new DraftValidationError(
              `Quiz question ${qi + 1} is too short in lesson ${i + 1} (${sectionTitle})`
            );
          }
          if (options.length < 2 || options.some((x) => x.length === 0)) {
            throw new DraftValidationError(
              `Quiz question ${qi + 1} must have filled options in lesson ${i + 1} (${sectionTitle})`
            );
          }
          if (answerIndex < 0 || answerIndex >= options.length || Number.isNaN(answerIndex)) {
            throw new DraftValidationError(
              `Quiz question ${qi + 1} must have valid answer index in lesson ${i + 1} (${sectionTitle})`
            );
          }

          preparedQuestions.push({
            q: prompt,
            options,
            answerIndex,
            explanation: String(qq.explanation || ""),
          });
        }

        preparedLessons.push({
          kind: "quiz",
          title: lessonTitle,
          isPreview: Boolean(l.isPreview),
          quiz: {
            title: String(q.title || lessonTitle || "Quiz").trim(),
            passPercent: Number(q.passPercent || 60),
            questions: preparedQuestions,
          },
        });
        continue;
      }

      if (type === "File") {
        const resources = Array.isArray(l.resources) ? l.resources : [];
        const hasDownload = Boolean(l.fileUrl) || resources.length > 0;

        if (!hasDownload) {
          throw new DraftValidationError(`File missing in lesson ${i + 1} (${sectionTitle})`);
        }

        const normalizedResources =
          resources.length > 0
            ? resources.map((r) => ({
                name: String(r?.name || lessonTitle || "Resource").trim(),
                url: String(r?.url || "").trim(),
                sizeBytes: Math.max(0, Number(r?.sizeBytes || 0)),
              }))
            : [{ name: lessonTitle || "Resource", url: String(l.fileUrl || "").trim(), sizeBytes: 0 }];

        if (normalizedResources.some((r) => r.url.length === 0)) {
          throw new DraftValidationError(`File missing in lesson ${i + 1} (${sectionTitle})`);
        }

        preparedLessons.push({
          kind: "file",
          title: lessonTitle,
          isPreview: Boolean(l.isPreview),
          resources: normalizedResources,
        });
        continue;
      }

      throw new DraftValidationError(`Unsupported lesson type in lesson ${i + 1} (${sectionTitle})`);
    }

    preparedSections.push({
      title: sectionTitle,
      lessons: preparedLessons,
    });
  }

  if (preparedSections.length < 1) {
    throw new DraftValidationError("At least 1 section with 1 lesson required");
  }

  return preparedSections;
}

async function materializeSectionsForCourse(
  preparedSections: PreparedSection[],
  courseId: string,
  instructorId: string
): Promise<BuiltSectionsResult> {
  let totalVideoSec = 0;
  let totalLectures = 0;
  const builtSections: any[] = [];
  const createdQuizIds: string[] = [];

  for (let sectionIdx = 0; sectionIdx < preparedSections.length; sectionIdx++) {
    const section = preparedSections[sectionIdx];
    const lectures: any[] = [];

    for (let i = 0; i < section.lessons.length; i++) {
      const lesson = section.lessons[i];

      if (lesson.kind === "video") {
        totalVideoSec += lesson.durationSec;
        totalLectures += 1;

        lectures.push({
          title: lesson.title,
          type: "video",
          videoUrl: lesson.videoUrl,
          durationSec: lesson.durationSec,
          isFreePreview: lesson.isPreview,
          order: i,
          resources: [],
        });
        continue;
      }

      if (lesson.kind === "file") {
        totalLectures += 1;

        lectures.push({
          title: lesson.title,
          type: "file",
          durationSec: 0,
          isFreePreview: lesson.isPreview,
          order: i,
          resources: lesson.resources,
        });
        continue;
      }

      const quizDoc = await Quiz.create({
        courseId,
        instructorId,
        title: lesson.quiz.title,
        passPercent: lesson.quiz.passPercent,
        questions: lesson.quiz.questions.map((qq) => ({
          prompt: qq.q,
          explanation: qq.explanation,
          options: qq.options.map((opt, idx) => ({
            text: opt,
            isCorrect: idx === qq.answerIndex,
          })),
        })),
      });

      createdQuizIds.push(String(quizDoc._id));
      totalLectures += 1;

      lectures.push({
        title: lesson.title,
        type: "quiz",
        quizId: quizDoc._id,
        durationSec: 0,
        isFreePreview: lesson.isPreview,
        order: i,
        resources: [],
      });
    }

    builtSections.push({
      title: section.title,
      order: sectionIdx,
      lectures,
    });
  }

  return {
    sections: builtSections,
    totalLectures,
    totalVideoSec,
    createdQuizIds,
  };
}

function extractQuizIdsFromCourseSections(sections: any[]): string[] {
  if (!Array.isArray(sections)) return [];

  const ids: string[] = [];
  for (const s of sections) {
    const lectures = Array.isArray(s?.lectures) ? s.lectures : [];
    for (const l of lectures) {
      if (l?.quizId) ids.push(String(l.quizId));
    }
  }

  return Array.from(new Set(ids));
}

function toPersistedCourseFields(draft: CourseDraft) {
  return {
    title: String(draft.title || "").trim(),
    subtitle: String(draft.subtitle || "").trim(),
    description: String(draft.description || "").trim(),
    outcomes: Array.isArray(draft.outcomes)
      ? draft.outcomes.map((x) => String(x || "").trim()).filter(Boolean)
      : [],
    requirements: Array.isArray(draft.requirements)
      ? draft.requirements.map((x) => String(x || "").trim()).filter(Boolean)
      : [],
    tags: Array.isArray(draft.tags)
      ? draft.tags.map((x) => String(x || "").trim().toLowerCase()).filter(Boolean)
      : [],
    category: String(draft.category || draft.subject || "").trim(),
    level: String(draft.level || "Beginner").trim(),
    language: String(draft.language || "English").trim(),
    thumbnailUrl: draft.thumbnailUrl || null,
    price: draft.priceType === "Free" ? 0 : Math.max(0, Number(draft.priceNpr || 0)),
    currency: "NPR",
  };
}

async function mapCourseToDraft(course: any): Promise<CourseDraft> {
  const quizIds = extractQuizIdsFromCourseSections(Array.isArray(course?.sections) ? course.sections : []);

  const quizDocs =
    quizIds.length > 0
      ? await Quiz.find({ _id: { $in: quizIds }, courseId: course._id })
          .select("title passPercent questions")
          .lean()
      : [];

  const quizMap = new Map<string, any>();
  for (const q of quizDocs) {
    quizMap.set(String(q._id), q);
  }

  const rawCategory = String(course?.category || "").trim();
  const category = KNOWN_CATEGORIES.has(rawCategory) ? rawCategory : "Academic";
  const subject =
    category === "Academic"
      ? KNOWN_SUBJECTS.has(rawCategory)
        ? rawCategory
        : "Mathematics"
      : "Other";

  const sections = Array.isArray(course?.sections)
    ? course.sections.map((s: any, sectionIdx: number) => {
        const lectures = Array.isArray(s?.lectures) ? s.lectures : [];

        const lessons: LessonDraft[] = lectures.map((l: any, lessonIdx: number) => {
          const lectureType = String(l?.type || "").toLowerCase();
          const id = String(l?._id || `l_${sectionIdx}_${lessonIdx}`);
          const title = String(l?.title || "Untitled lesson");

          if (lectureType === "video") {
            return {
              id,
              title,
              type: "Video",
              durationMin: Math.max(0, Math.round(Number(l?.durationSec || 0) / 60)),
              isPreview: Boolean(l?.isFreePreview),
              videoUrl: l?.videoUrl ? String(l.videoUrl) : undefined,
              resources: [],
            };
          }

          if (lectureType === "quiz") {
            const quiz = quizMap.get(String(l?.quizId || ""));

            return {
              id,
              title,
              type: "Quiz",
              durationMin: 0,
              isPreview: Boolean(l?.isFreePreview),
              resources: [],
              quiz: {
                title: String(quiz?.title || title || "Quiz"),
                passPercent: Number(quiz?.passPercent || 60),
                questions: Array.isArray(quiz?.questions)
                  ? quiz.questions.map((qq: any) => {
                      const options = Array.isArray(qq?.options) ? qq.options.map((opt: any) => String(opt?.text || "")) : [];
                      let answerIndex = options.findIndex((_: string, idx: number) => Boolean(qq?.options?.[idx]?.isCorrect));
                      if (answerIndex < 0) answerIndex = 0;
                      return {
                        q: String(qq?.prompt || ""),
                        options,
                        answerIndex,
                        explanation: String(qq?.explanation || ""),
                      };
                    })
                  : [],
              },
            };
          }

          const resources = Array.isArray(l?.resources)
            ? l.resources.map((r: any, resourceIdx: number) => ({
                name: String(r?.name || `Resource ${resourceIdx + 1}`),
                url: String(r?.url || ""),
                sizeBytes: Math.max(0, Number(r?.sizeBytes || 0)),
              }))
            : [];

          return {
            id,
            title,
            type: "File",
            durationMin: 0,
            isPreview: Boolean(l?.isFreePreview),
            resources,
            fileUrl: resources.length > 0 ? resources[0].url : undefined,
          };
        });

        return {
          title: String(s?.title || `Section ${sectionIdx + 1}`),
          lessons,
        };
      })
    : [];

  const safeSections =
    sections.length > 0
      ? sections
      : [
          {
            title: "Curriculum",
            lessons: [],
          },
        ];

  return {
    title: String(course?.title || ""),
    subtitle: String(course?.subtitle || ""),
    description: String(course?.description || ""),
    category,
    subject,
    level: String(course?.level || "Class 10 (SEE)"),
    language: String(course?.language || "English"),
    priceType: Number(course?.price || 0) > 0 ? "Paid" : "Free",
    priceNpr: Math.max(0, Number(course?.price || 0)),
    thumbnailUrl: course?.thumbnailUrl ? String(course.thumbnailUrl) : undefined,
    outcomes: Array.isArray(course?.outcomes) && course.outcomes.length > 0 ? course.outcomes.map(String) : [""],
    requirements:
      Array.isArray(course?.requirements) && course.requirements.length > 0
        ? course.requirements.map(String)
        : [""],
    tags: Array.isArray(course?.tags) ? course.tags.map(String) : [],
    sections: safeSections,
  };
}

export async function createInstructorCourse(req: AuthedRequest, res: Response) {
  try {
    const instructorId = req.user!.id;
    const { draft } = req.body as { draft: CourseDraft };

    if (!draft) return res.status(400).json({ message: "draft required" });

    validateBaseDraft(draft);
    const preparedSections = prepareSectionsFromDraft(draft);

    const course = await Course.create({
      instructorId,
      ...toPersistedCourseFields(draft),
      status: "Pending",
      rejectionReason: null,
      sections: [],
      totalLectures: 0,
      totalVideoSec: 0,
    });

    let createdQuizIds: string[] = [];

    try {
      const built = await materializeSectionsForCourse(preparedSections, String(course._id), String(instructorId));
      createdQuizIds = built.createdQuizIds;

      course.sections = built.sections as any;
      course.totalLectures = built.totalLectures;
      course.totalVideoSec = built.totalVideoSec;

      await course.save();

      return res.status(201).json({
        item: { id: String(course._id), status: course.status },
        message: "Submitted for admin approval",
      });
    } catch (e) {
      if (createdQuizIds.length > 0) {
        await Quiz.deleteMany({ _id: { $in: createdQuizIds } });
      }
      await Course.findByIdAndDelete(course._id);
      throw e;
    }
  } catch (e: any) {
    const message = e instanceof DraftValidationError ? e.message : e?.message || "Failed to create course";
    const statusCode = e instanceof DraftValidationError ? 400 : 500;
    return res.status(statusCode).json({ message });
  }
}

export async function resubmitInstructorCourse(req: AuthedRequest, res: Response) {
  try {
    const instructorId = req.user!.id;
    const id = String(req.params.id || "");
    const { draft } = req.body as { draft: CourseDraft };

    if (!draft) return res.status(400).json({ message: "draft required" });

    const course = await Course.findOne({ _id: id, instructorId });
    if (!course) return res.status(404).json({ message: "Course not found" });

    const allowedStatuses = new Set(["Rejected", "Draft", "Published", "Pending"]);
    if (!allowedStatuses.has(String(course.status))) {
      return res.status(400).json({ message: "This course cannot be edited right now" });
    }

    validateBaseDraft(draft);
    const preparedSections = prepareSectionsFromDraft(draft);
    const oldQuizIds = extractQuizIdsFromCourseSections(Array.isArray(course.sections) ? (course.sections as any[]) : []);

    let createdQuizIds: string[] = [];

    try {
      const built = await materializeSectionsForCourse(preparedSections, String(course._id), String(instructorId));
      createdQuizIds = built.createdQuizIds;

      const fields = toPersistedCourseFields(draft);
      course.title = fields.title;
      course.subtitle = fields.subtitle;
      course.description = fields.description;
      course.outcomes = fields.outcomes;
      course.requirements = fields.requirements;
      course.tags = fields.tags;
      course.category = fields.category;
      course.level = fields.level;
      course.language = fields.language;
      course.thumbnailUrl = fields.thumbnailUrl;
      course.price = fields.price;
      course.currency = fields.currency;

      course.sections = built.sections as any;
      course.totalLectures = built.totalLectures;
      course.totalVideoSec = built.totalVideoSec;
      course.status = "Pending";
      course.rejectionReason = null;

      await course.save();

      if (oldQuizIds.length > 0) {
        await Quiz.deleteMany({ _id: { $in: oldQuizIds }, courseId: course._id, instructorId });
      }

      return res.json({
        item: { id: String(course._id), status: course.status },
        message: "Course updated and resubmitted for admin approval",
      });
    } catch (e) {
      if (createdQuizIds.length > 0) {
        await Quiz.deleteMany({ _id: { $in: createdQuizIds }, courseId: course._id, instructorId });
      }
      throw e;
    }
  } catch (e: any) {
    const message = e instanceof DraftValidationError ? e.message : e?.message || "Failed to resubmit course";
    const statusCode = e instanceof DraftValidationError ? 400 : 500;
    return res.status(statusCode).json({ message });
  }
}

export async function getInstructorCourseById(req: AuthedRequest, res: Response) {
  try {
    const instructorId = req.user!.id;
    const id = String(req.params.id || "");

    const course = await Course.findOne({ _id: id, instructorId }).lean();
    if (!course) return res.status(404).json({ message: "Course not found" });

    const draft = await mapCourseToDraft(course);

    return res.json({
      item: {
        id: String(course._id),
        title: String(course.title || ""),
        status: course.status,
        rejectionReason: course.rejectionReason ?? null,
        createdAt: course.createdAt,
        draft,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to load course" });
  }
}

export async function deleteInstructorCourse(req: AuthedRequest, res: Response) {
  try {
    const instructorId = req.user!.id;
    const id = String(req.params.id || "");

    const course = await Course.findOne({ _id: id, instructorId }).lean();
    if (!course) return res.status(404).json({ message: "Course not found" });

    const quizIds = extractQuizIdsFromCourseSections(Array.isArray(course.sections) ? (course.sections as any[]) : []);
    if (quizIds.length > 0) {
      await Quiz.deleteMany({ _id: { $in: quizIds }, courseId: id, instructorId });
    }

    await Course.deleteOne({ _id: id, instructorId });

    return res.json({ message: "Course deleted successfully" });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to delete course" });
  }
}

export async function listInstructorCourses(req: AuthedRequest, res: Response) {
  try {
    const instructorId = req.user!.id;

    const items = await Course.find({ instructorId })
      .select("title subtitle status rejectionReason createdAt totalLectures totalVideoSec price")
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
        priceNpr: Number(c.price ?? 0),
      })),
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to load instructor courses" });
  }
}
