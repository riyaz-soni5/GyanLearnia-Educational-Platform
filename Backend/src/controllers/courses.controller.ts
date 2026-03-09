import { Request, Response } from "express";
import { Types } from "mongoose";
import Course from "../models/Course.model.js";
import Quiz from "../models/Quiz.model.js";
import Enrollment from "../models/Enrollment.model.js";
import User from "../models/User.model.js";
import CourseReview from "../models/CourseReview.model.js";
import { AuthedRequest } from "../middlewares/auth.middleware.js";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const flattenLectures = (course: any) => {
  const sections = Array.isArray(course?.sections) ? course.sections : [];
  const list: Array<{
    lectureId: string;
    type: string;
    quizId?: string;
  }> = [];

  for (const s of sections) {
    const lectures = Array.isArray(s?.lectures) ? s.lectures : [];
    for (const l of lectures) {
      list.push({
        lectureId: String(l?._id ?? ""),
        type: String(l?.type ?? ""),
        quizId: l?.quizId ? String(l.quizId) : undefined,
      });
    }
  }

  return list.filter((x) => x.lectureId);
};

const isProgressTrackedLecture = (type: string) => {
  const normalized = String(type || "").toLowerCase();
  return normalized === "video" || normalized === "quiz";
};

const getProgressTrackedLectures = (course: any) =>
  flattenLectures(course).filter((lecture) => isProgressTrackedLecture(lecture.type));

const recalcCompletion = async (enrollment: any, course: any) => {
  const trackedLectures = getProgressTrackedLectures(course);
  const lectureSet = new Set(trackedLectures.map((l) => l.lectureId));

  const normalizedCompleted = Array.isArray(enrollment.completedLectureIds)
    ? enrollment.completedLectureIds.filter((id: string) => lectureSet.has(String(id))).map(String)
    : [];

  enrollment.completedLectureIds = Array.from(new Set(normalizedCompleted));

  const completedCount = enrollment.completedLectureIds.length;
  const totalCount = trackedLectures.length;
  const percent = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

  if (totalCount > 0 && completedCount >= totalCount) {
    if (!enrollment.completedAt) enrollment.completedAt = new Date();
  } else {
    enrollment.completedAt = null;
  }

  await enrollment.save();

  return {
    completedCount,
    totalCount,
    percent,
    isCompleted: Boolean(enrollment.completedAt),
  };
};

const toOneDecimal = (value: number) => Math.round(value * 10) / 10;

const toReviewItem = (review: any, currentUserId?: string) => {
  const user = review?.userId as any;
  const userName =
    [String(user?.firstName || "").trim(), String(user?.lastName || "").trim()]
      .filter(Boolean)
      .join(" ")
      .trim() || "Student";

  return {
    id: String(review?._id || ""),
    rating: Number(review?.rating || 0),
    comment: String(review?.comment || ""),
    createdAt: review?.createdAt || null,
    updatedAt: review?.updatedAt || null,
    user: {
      id: String(user?._id || ""),
      name: userName,
      avatarUrl: user?.avatarUrl ?? null,
    },
    isMine: Boolean(currentUserId && String(user?._id || "") === String(currentUserId)),
  };
};

export async function listPublishedCourses(req: AuthedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const items = await Course.find({ status: "Published" })
      .select("title subtitle thumbnailUrl category level language price currency tags totalLectures totalVideoSec createdAt")
      .populate("instructorId", "firstName lastName email avatarUrl")
      .sort({ createdAt: -1 })
      .lean();

    const courseIds = items
      .map((c: any) => c?._id)
      .filter((id: any) => Boolean(id))
      .map((id: any) => new Types.ObjectId(String(id)));

    const ratingAgg =
      courseIds.length > 0
        ? await CourseReview.aggregate([
            { $match: { courseId: { $in: courseIds } } },
            { $group: { _id: "$courseId", averageRating: { $avg: "$rating" }, reviewsCount: { $sum: 1 } } },
          ])
        : [];

    const enrolledAgg =
      courseIds.length > 0
        ? await Enrollment.aggregate([
            { $match: { courseId: { $in: courseIds } } },
            { $group: { _id: "$courseId", enrolled: { $sum: 1 } } },
          ])
        : [];

    const ratingMap = new Map<string, { averageRating: number; reviewsCount: number }>(
      ratingAgg.map((r: any) => [
        String(r._id),
        {
          averageRating: toOneDecimal(Number(r.averageRating || 0)),
          reviewsCount: Number(r.reviewsCount || 0),
        },
      ])
    );
    const enrolledMap = new Map<string, number>(
      enrolledAgg.map((r: any) => [String(r._id), Number(r.enrolled || 0)])
    );
    const myEnrollmentSet =
      userId && courseIds.length > 0
        ? new Set(
            (
              await Enrollment.find({ userId, courseId: { $in: courseIds } })
                .select("courseId")
                .lean()
            ).map((row: any) => String(row.courseId))
          )
        : new Set<string>();

    return res.json({
      items: items.map((c: any) => ({
        ...(ratingMap.get(String(c._id)) || { averageRating: 0, reviewsCount: 0 }),
        enrolled: enrolledMap.get(String(c._id)) || 0,
        isEnrolled: myEnrollmentSet.has(String(c._id)),
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
              avatarUrl: c.instructorId.avatarUrl ?? null,
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
      .populate("instructorId", "firstName lastName email avatarUrl")
      .lean();
    if (!c) return res.status(404).json({ message: "Course not found" });

    const instructorDoc = c.instructorId as any;
    const instructor = instructorDoc
      ? {
          name: [instructorDoc.firstName, instructorDoc.lastName].filter(Boolean).join(" ").trim(),
          email: instructorDoc.email,
          avatarUrl: instructorDoc.avatarUrl ?? null,
        }
      : null;

    const [ratingAgg, enrolledCount] = await Promise.all([
      CourseReview.aggregate([
        { $match: { courseId: new Types.ObjectId(String(c._id)) } },
        { $group: { _id: null, averageRating: { $avg: "$rating" }, reviewsCount: { $sum: 1 } } },
      ]).then((rows) => rows[0]),
      Enrollment.countDocuments({ courseId: c._id }),
    ]);

    const averageRating = toOneDecimal(Number(ratingAgg?.averageRating || 0));
    const reviewsCount = Number(ratingAgg?.reviewsCount || 0);

    return res.json({
      item: {
        ...c,
        instructor,
        averageRating,
        reviewsCount,
        enrolled: Number(enrolledCount || 0),
        rating: averageRating,
        certificate: {
          enabled: Boolean((c as any)?.certificate?.enabled),
          template: {
            imageUrl: String((c as any)?.certificate?.template?.imageUrl || ""),
            nameXPercent: Number((c as any)?.certificate?.template?.nameXPercent ?? 50),
            nameYPercent: Number((c as any)?.certificate?.template?.nameYPercent ?? 55),
            nameFontSizePx: Number((c as any)?.certificate?.template?.nameFontSizePx ?? 42),
            nameColor: String((c as any)?.certificate?.template?.nameColor || "#111827"),
          },
        },
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

export async function submitPublishedCourseQuiz(req: AuthedRequest, res: Response) {
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
    const passed = scorePercent >= passPercent;

    const userId = req.user?.id;
    if (userId) {
      const enrollment = await Enrollment.findOne({ userId, courseId });

      if (!enrollment) {
        return res.status(400).json({ message: "Please enroll in this course first" });
      }

      enrollment.quizScores.set(String(quiz._id), scorePercent);

      const lectureList = flattenLectures(course);
      const quizLecture = lectureList.find((x) => String(x.quizId || "") === String(quizId));
      if (passed && quizLecture?.lectureId) {
        const existing = new Set((enrollment.completedLectureIds || []).map((x: string) => String(x)));
        existing.add(String(quizLecture.lectureId));
        enrollment.completedLectureIds = Array.from(existing);
      }

      await recalcCompletion(enrollment, course);
    }

    return res.json({
      item: {
        quizId: String(quiz._id),
        totalQuestions: questions.length,
        correctCount,
        scorePercent,
        passPercent,
        passed,
        details,
      },
    });
  } catch {
    return res.status(400).json({ message: "Invalid request" });
  }
}

export async function enrollPublishedCourse(req: AuthedRequest, res: Response) {
  try {
    const courseId = String(req.params.id || "");
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const course = await Course.findOne({ _id: courseId, status: "Published" }).select("sections").lean();
    if (!course) return res.status(404).json({ message: "Course not found" });

    const enrollment = await Enrollment.findOneAndUpdate(
      { userId, courseId },
      { $setOnInsert: { userId, courseId } },
      { upsert: true, new: true }
    );

    if (!enrollment) return res.status(500).json({ message: "Failed to enroll" });
    const progress = await recalcCompletion(enrollment, course);

    return res.json({ item: { enrolled: true, ...progress } });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to enroll course" });
  }
}

export async function getMyCourseProgress(req: AuthedRequest, res: Response) {
  try {
    const courseId = String(req.params.id || "");
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const course = await Course.findOne({ _id: courseId, status: "Published" })
      .select("sections certificate")
      .lean();
    if (!course) return res.status(404).json({ message: "Course not found" });

    const enrollment = await Enrollment.findOne({ userId, courseId });
    if (!enrollment) {
      const trackedLectures = getProgressTrackedLectures(course);
      return res.json({
        item: {
          enrolled: false,
          completedCount: 0,
          totalCount: trackedLectures.length,
          percent: 0,
          isCompleted: false,
          completedLectureIds: [],
          quizScores: {},
          certificateEligible: false,
        },
      });
    }

    const progress = await recalcCompletion(enrollment, course);
    const completedSet = new Set((enrollment.completedLectureIds || []).map((x: string) => String(x)));
    const rawQuizScores = enrollment.quizScores;
    const quizScores =
      rawQuizScores instanceof Map
        ? Object.fromEntries(rawQuizScores.entries())
        : rawQuizScores && typeof rawQuizScores === "object"
        ? Object.fromEntries(
            Object.entries(rawQuizScores).map(([k, v]) => [String(k), Number(v || 0)])
          )
        : {};

    return res.json({
      item: {
        enrolled: true,
        ...progress,
        completedLectureIds: Array.from(completedSet),
        quizScores,
        certificateEligible: progress.isCompleted && Boolean((course as any)?.certificate?.enabled),
      },
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to load course progress" });
  }
}

export async function completeCourseLecture(req: AuthedRequest, res: Response) {
  try {
    const courseId = String(req.params.id || "");
    const lectureId = String(req.params.lectureId || "");
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const course = await Course.findOne({ _id: courseId, status: "Published" }).select("sections").lean();
    if (!course) return res.status(404).json({ message: "Course not found" });

    const lectures = flattenLectures(course);
    const lecture = lectures.find((x) => x.lectureId === lectureId);
    if (!lecture) return res.status(404).json({ message: "Lecture not found" });
    if (lecture.type === "quiz") {
      return res.status(400).json({ message: "Quiz lectures are completed only after passing the quiz" });
    }
    if (lecture.type === "file") {
      return res.status(400).json({ message: "File lectures do not require completion" });
    }
    if (lecture.type !== "video") {
      return res.status(400).json({ message: "Only video lectures can be completed manually" });
    }

    const enrollment = await Enrollment.findOne({ userId, courseId });
    if (!enrollment) {
      return res.status(400).json({ message: "Please enroll in this course first" });
    }

    const existing = new Set((enrollment.completedLectureIds || []).map((x: string) => String(x)));
    existing.add(lectureId);
    enrollment.completedLectureIds = Array.from(existing);

    const progress = await recalcCompletion(enrollment, course);

    return res.json({
      item: {
        ...progress,
        completedLectureIds: enrollment.completedLectureIds,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to complete lecture" });
  }
}

export async function getPublishedCourseReviews(req: AuthedRequest, res: Response) {
  try {
    const courseId = String(req.params.id || "");
    const currentUserId = req.user?.id;
    const course = await Course.findOne({ _id: courseId, status: "Published" }).select("_id").lean();
    if (!course) return res.status(404).json({ message: "Course not found" });

    const reviews = await CourseReview.find({ courseId })
      .populate("userId", "firstName lastName avatarUrl")
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const reviewsCount = reviews.length;
    const averageRating =
      reviewsCount > 0
        ? toOneDecimal(reviews.reduce((acc: number, review: any) => acc + Number(review.rating || 0), 0) / reviewsCount)
        : 0;

    return res.json({
      item: {
        averageRating,
        reviewsCount,
        items: reviews.map((review: any) => toReviewItem(review, currentUserId)),
      },
    });
  } catch {
    return res.status(400).json({ message: "Invalid id" });
  }
}

export async function upsertCourseReview(req: AuthedRequest, res: Response) {
  try {
    const courseId = String(req.params.id || "");
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || "").trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be an integer from 1 to 5" });
    }
    if (comment.length < 3) {
      return res.status(400).json({ message: "Review comment must be at least 3 characters" });
    }
    if (comment.length > 1200) {
      return res.status(400).json({ message: "Review comment is too long" });
    }

    const [course, enrollment] = await Promise.all([
      Course.findOne({ _id: courseId, status: "Published" }).select("_id").lean(),
      Enrollment.findOne({ userId, courseId }).select("completedAt").lean(),
    ]);

    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!enrollment?.completedAt) {
      return res.status(403).json({ message: "Complete the course before leaving a review" });
    }

    const existing = await CourseReview.findOne({ userId, courseId }).select("_id").lean();
    if (existing) {
      return res.status(409).json({ message: "You have already submitted a review for this course" });
    }

    const created = await CourseReview.create({
      userId,
      courseId,
      rating,
      comment,
    });

    const review = await CourseReview.findById(created._id)
      .populate("userId", "firstName lastName avatarUrl")
      .lean();

    if (!review) return res.status(500).json({ message: "Failed to save review" });

    return res.json({
      item: toReviewItem(review, userId),
    });
  } catch (e: any) {
    if (e?.code === 11000) {
      return res.status(409).json({ message: "You have already submitted a review for this course" });
    }
    return res.status(500).json({ message: e?.message || "Failed to submit review" });
  }
}

export async function getCourseCertificate(req: AuthedRequest, res: Response) {
  try {
    const courseId = String(req.params.id || "");
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const [course, user, enrollment] = await Promise.all([
      Course.findOne({ _id: courseId, status: "Published" }).select("title certificate sections").lean(),
      User.findById(userId).select("firstName lastName email").lean(),
      Enrollment.findOne({ userId, courseId }).lean(),
    ]);

    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!user) return res.status(404).json({ message: "User not found" });

    const certEnabled = Boolean((course as any)?.certificate?.enabled);
    if (!certEnabled) return res.status(400).json({ message: "Certificate is not enabled for this course" });
    if (!enrollment?.completedAt) return res.status(400).json({ message: "Complete the course to unlock certificate" });

    const t = (course as any)?.certificate?.template || {};
    const templateImageUrl = String(t?.imageUrl || "").trim();
    if (!templateImageUrl) return res.status(400).json({ message: "Certificate template is not configured yet" });

    const studentName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || String(user.email || "Student");
    const nameX = Number(t?.nameXPercent ?? 50);
    const nameY = Number(t?.nameYPercent ?? 55);
    const fontSize = Number(t?.nameFontSizePx ?? 42);
    const nameColor = String(t?.nameColor || "#111827");
    const completedOn = new Date(enrollment.completedAt).toLocaleDateString();
    const courseTitle = String((course as any)?.title || "Course");
    const safeStudentName = escapeHtml(studentName);
    const safeCourseTitle = escapeHtml(courseTitle);
    const safeCompletedOn = escapeHtml(completedOn);

    let embeddedTemplateUrl = templateImageUrl;
    try {
      const imgRes = await fetch(templateImageUrl);
      if (imgRes.ok) {
        const contentType = imgRes.headers.get("content-type") || "image/png";
        const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
        embeddedTemplateUrl = `data:${contentType};base64,${imgBuffer.toString("base64")}`;
      }
    } catch {
      // keep external URL fallback
    }

    const filenameBase = slugify(`${courseTitle}-${studentName}-certificate`) || "course-certificate";

    const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Certificate - ${courseTitle}</title></head>
<body style="margin:0;padding:20px;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:1100px;margin:0 auto 16px auto;display:flex;justify-content:flex-end;">
    <button id="download-png" type="button" style="cursor:pointer;border:0;background:#111827;color:#fff;padding:10px 14px;border-radius:8px;font-weight:600;font-size:14px;">Download Certificate (.png)</button>
  </div>
  <div style="position:relative;max-width:1100px;margin:0 auto;background:#fff;box-shadow:0 8px 30px rgba(0,0,0,.1);">
    <img src="${embeddedTemplateUrl}" alt="certificate" style="display:block;width:100%;height:auto;" />
    <div style="position:absolute;left:${nameX}%;top:${nameY}%;transform:translate(-50%,-50%);font-size:${fontSize}px;color:${nameColor};font-weight:700;white-space:nowrap;">
      ${safeStudentName}
    </div>
  </div>
  <p style="text-align:center;color:#4b5563;margin-top:14px;">${safeCourseTitle} • Completed on ${safeCompletedOn}</p>
  <script>
    (function () {
      var btn = document.getElementById("download-png");
      if (!btn) return;

      var templateSrc = ${JSON.stringify(embeddedTemplateUrl)};
      var studentName = ${JSON.stringify(studentName)};
      var nameXPercent = ${JSON.stringify(Math.max(0, Math.min(100, nameX)))};
      var nameYPercent = ${JSON.stringify(Math.max(0, Math.min(100, nameY)))};
      var nameFontSize = ${JSON.stringify(Math.max(16, Math.min(96, fontSize)))};
      var nameColor = ${JSON.stringify(nameColor)};
      var fileName = ${JSON.stringify(filenameBase + ".png")};

      btn.addEventListener("click", function () {
        var originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Preparing PNG...";

        var img = new Image();
        img.decoding = "async";
        img.crossOrigin = "anonymous";

        img.onload = function () {
          try {
            var width = img.naturalWidth || 1600;
            var height = img.naturalHeight || 1131;
            var canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            var ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas not supported");

            ctx.drawImage(img, 0, 0, width, height);
            ctx.fillStyle = nameColor;
            ctx.font = "700 " + nameFontSize + "px Arial, Helvetica, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            var x = (nameXPercent / 100) * width;
            var y = (nameYPercent / 100) * height;
            ctx.fillText(studentName, x, y);

            canvas.toBlob(function (blob) {
              if (!blob) {
                alert("Failed to generate PNG");
                btn.disabled = false;
                btn.textContent = originalText;
                return;
              }
              var url = URL.createObjectURL(blob);
              var a = document.createElement("a");
              a.href = url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
              btn.disabled = false;
              btn.textContent = originalText;
            }, "image/png");
          } catch (_err) {
            alert("Failed to generate PNG");
            btn.disabled = false;
            btn.textContent = originalText;
          }
        };

        img.onerror = function () {
          alert("Could not load certificate template image");
          btn.disabled = false;
          btn.textContent = originalText;
        };

        img.src = templateSrc;
      });
    })();
  </script>
</body>
</html>`;

    return res.json({
      item: {
        courseId,
        courseTitle,
        studentName,
        completedOn,
        templateImageUrl,
        html,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to generate certificate" });
  }
}
