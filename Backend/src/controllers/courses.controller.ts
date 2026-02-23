import { Request, Response } from "express";
import Course from "../models/Course.model.js";
import Quiz from "../models/Quiz.model.js";

export async function listPublishedCourses(_req: Request, res: Response) {
  try {
    const items = await Course.find({ status: "Published" })
      .select("title subtitle thumbnailUrl category level language price currency tags totalLectures totalVideoSec createdAt")
      .populate("instructorId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      items: items.map((c: any) => ({
        id: String(c._id),
        title: c.title,
        subtitle: c.subtitle,
        thumbnailUrl: c.thumbnailUrl,
        category: c.category,
        level: c.level,
        language: c.language,
        price: c.price,
        currency: c.currency,
        tags: Array.isArray(c.tags) ? c.tags : [],
        totalLectures: Number(c.totalLectures ?? 0),
        totalVideoSec: Number(c.totalVideoSec ?? 0),
        instructor: c.instructorId
          ? {
              name: [c.instructorId.firstName, c.instructorId.lastName].filter(Boolean).join(" ").trim(),
              email: c.instructorId.email,
            }
          : undefined,
      })),
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to load courses" });
  }
}

export async function getPublishedCourse(req: Request, res: Response) {
  try {
    const id = req.params.id;

    const c = await Course.findOne({ _id: id, status: "Published" })
      .populate("instructorId", "firstName lastName email")
      .lean();
    if (!c) return res.status(404).json({ message: "Course not found" });

    const instructorDoc = c.instructorId as any;
    const instructor = instructorDoc
      ? {
          name: [instructorDoc.firstName, instructorDoc.lastName].filter(Boolean).join(" ").trim(),
          email: instructorDoc.email,
        }
      : null;

    return res.json({
      item: {
        ...c,
        instructor,
      },
    });
  } catch {
    return res.status(400).json({ message: "Invalid id" });
  }
}

export async function getPublishedCourseQuiz(req: Request, res: Response) {
  try {
    const courseId = req.params.id;
    const quizId = req.params.quizId;

    const course = await Course.findOne({ _id: courseId, status: "Published" })
      .select("sections")
      .lean();

    if (!course) return res.status(404).json({ message: "Course not found" });

    const hasQuizInCourse = Array.isArray(course.sections)
      ? course.sections.some((s: any) =>
          Array.isArray(s?.lectures)
            ? s.lectures.some((l: any) => String(l?.quizId ?? "") === String(quizId))
            : false
        )
      : false;

    if (!hasQuizInCourse) {
      return res.status(404).json({ message: "Quiz not found in this course" });
    }

    const quiz = await Quiz.findOne({ _id: quizId, courseId })
      .select("title passPercent questions")
      .lean();

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    return res.json({
      item: {
        id: String(quiz._id),
        title: quiz.title,
        passPercent: Number(quiz.passPercent ?? 60),
        questions: (quiz.questions || []).map((q: any) => ({
          id: String(q._id),
          prompt: q.prompt,
          explanation: q.explanation ?? "",
          options: (q.options || []).map((o: any) => ({
            id: String(o._id),
            text: o.text,
          })),
        })),
      },
    });
  } catch {
    return res.status(400).json({ message: "Invalid id" });
  }
}

export async function submitPublishedCourseQuiz(req: Request, res: Response) {
  try {
    const courseId = req.params.id;
    const quizId = req.params.quizId;
    const answers = (req.body?.answers ?? {}) as Record<string, string>;

    const course = await Course.findOne({ _id: courseId, status: "Published" })
      .select("sections")
      .lean();
    if (!course) return res.status(404).json({ message: "Course not found" });

    const hasQuizInCourse = Array.isArray(course.sections)
      ? course.sections.some((s: any) =>
          Array.isArray(s?.lectures)
            ? s.lectures.some((l: any) => String(l?.quizId ?? "") === String(quizId))
            : false
        )
      : false;
    if (!hasQuizInCourse) {
      return res.status(404).json({ message: "Quiz not found in this course" });
    }

    const quiz = await Quiz.findOne({ _id: quizId, courseId }).lean();
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
    if (questions.length === 0) {
      return res.status(400).json({ message: "Quiz has no questions" });
    }

    let correctCount = 0;

    const details = questions.map((q: any) => {
      const questionId = String(q._id);
      const selectedOptionId = answers[questionId] ? String(answers[questionId]) : "";
      const options = Array.isArray(q.options) ? q.options : [];
      const correctOption = options.find((o: any) => Boolean(o?.isCorrect));
      const correctOptionId = correctOption ? String(correctOption._id) : "";
      const isCorrect = selectedOptionId !== "" && selectedOptionId === correctOptionId;
      if (isCorrect) correctCount += 1;

      return {
        questionId,
        selectedOptionId: selectedOptionId || null,
        correctOptionId: correctOptionId || null,
        isCorrect,
        explanation: q.explanation ?? "",
      };
    });

    const scorePercent = Math.round((correctCount / questions.length) * 100);
    const passPercent = Number(quiz.passPercent ?? 60);

    return res.json({
      item: {
        quizId: String(quiz._id),
        totalQuestions: questions.length,
        correctCount,
        scorePercent,
        passPercent,
        passed: scorePercent >= passPercent,
        details,
      },
    });
  } catch {
    return res.status(400).json({ message: "Invalid request" });
  }
}
