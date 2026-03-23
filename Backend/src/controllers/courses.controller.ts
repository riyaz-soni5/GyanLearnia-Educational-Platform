import { Request, Response } from "express";
import axios from "axios";
import { Types } from "mongoose";
import Course from "../models/Course.model.js";
import Quiz from "../models/Quiz.model.js";
import Enrollment from "../models/Enrollment.model.js";
import User from "../models/User.model.js";
import CourseReview from "../models/CourseReview.model.js";
import CoursePurchase from "../models/CoursePurchase.model.js";
import WalletTransaction from "../models/WalletTransaction.model.js";
import Question from "../models/Question.model.js";
import { AuthedRequest } from "../middlewares/auth.middleware.js";
import { creditUserWallet } from "../services/wallet.service.js";

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

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

const KHALTI_INITIATE_URL = "https://dev.khalti.com/api/v2/epayment/initiate/";
const KHALTI_LOOKUP_URL = "https://dev.khalti.com/api/v2/epayment/lookup/";

const normalizeKhaltiSecretKey = (raw: string): string => {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (value.startsWith("test_secret_key_")) return value.replace("test_secret_key_", "");
  if (value.startsWith("live_secret_key_")) return value.replace("live_secret_key_", "");
  return value;
};

const formatKhaltiError = (payload: unknown): string => {
  if (!payload) return "Khalti request failed";
  if (typeof payload === "string") return payload;
  if (typeof payload !== "object") return "Khalti request failed";

  const data = payload as Record<string, unknown>;
  if (typeof data.detail === "string" && data.detail.trim()) return data.detail;
  if (typeof data.error_key === "string" && data.error_key.trim()) return data.error_key;

  const first = Object.values(data).find((value) => typeof value === "string");
  if (typeof first === "string" && first.trim()) return first;
  return "Khalti request failed";
};

const isValidHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const asPaisa = (value: unknown): number => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  const rounded = Math.round(amount);
  return rounded > 0 ? rounded : 0;
};

const coursePriceToPaisa = (priceNpr: unknown): number => {
  const amount = Number(priceNpr);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round(amount * 100);
};

const ensureCourseEnrollment = async (userId: string, courseId: string, course: any) => {
  const enrollment = await Enrollment.findOneAndUpdate(
    { userId, courseId },
    { $setOnInsert: { userId, courseId } },
    { upsert: true, new: true }
  );
  if (!enrollment) return null;

  const progress = await recalcCompletion(enrollment, course);
  return { enrollment, progress };
};

const ensureInstructorCreditForPurchase = async (purchase: any, courseTitle: string) => {
  const purchaseId = String(purchase?._id || "").trim();
  const pidx = String(purchase?.pidx || "").trim();
  const instructorId = String(purchase?.instructorId || "").trim();
  const pricePaisa = asPaisa(purchase?.pricePaisa);
  const instructorSharePaisa = asPaisa(purchase?.instructorSharePaisa) || Math.floor(pricePaisa * 0.7);
  const platformFeePaisa = Math.max(0, Number(purchase?.platformFeePaisa || pricePaisa - instructorSharePaisa));
  const existingCreditTxId = String(purchase?.instructorCreditTxId || "").trim();

  if (!purchaseId || !pidx || !instructorId || instructorSharePaisa <= 0) {
    return { ok: false as const, error: "Invalid instructor payout details" };
  }

  if (existingCreditTxId && !existingCreditTxId.startsWith("pending-")) {
    return { ok: true as const, transactionId: existingCreditTxId };
  }

  const lockToken = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const lockAcquired = await CoursePurchase.findOneAndUpdate(
    {
      _id: purchaseId,
      $or: [{ instructorCreditTxId: null }, { instructorCreditTxId: "" }],
    },
    { $set: { instructorCreditTxId: lockToken } },
    { new: true }
  )
    .select("_id")
    .lean();

  if (!lockAcquired) {
    const latest = await CoursePurchase.findById(purchaseId).select("instructorCreditTxId").lean();
    const latestTxId = String((latest as any)?.instructorCreditTxId || "").trim();
    if (latestTxId && !latestTxId.startsWith("pending-")) {
      return { ok: true as const, transactionId: latestTxId };
    }
    return { ok: false as const, error: "Instructor payout is being processed. Please retry shortly." };
  }

  const existingCreditTx = await WalletTransaction.findOne({
    type: "course_sale_credit",
    status: "completed",
    "metadata.pidx": pidx,
  })
    .select("_id")
    .lean();

  if (existingCreditTx?._id) {
    const txId = String(existingCreditTx._id);
    await CoursePurchase.findOneAndUpdate(
      { _id: purchaseId, instructorCreditTxId: lockToken },
      {
        $set: {
          instructorCreditTxId: txId,
          instructorCreditedAt: purchase?.instructorCreditedAt || new Date(),
        },
      }
    );
    return { ok: true as const, transactionId: txId };
  }

  const credited = await creditUserWallet({
    userId: instructorId,
    amountPaisa: instructorSharePaisa,
    type: "course_sale_credit",
    note: `Course sale payout (${courseTitle})`,
    referenceId: `course-sale-${pidx}`,
    metadata: {
      provider: "khalti",
      pidx,
      courseId: String(purchase?.courseId || ""),
      buyerId: String(purchase?.userId || ""),
      paidAmountPaisa: asPaisa(purchase?.paidAmountPaisa),
      instructorSharePaisa,
      platformFeePaisa,
    },
  });

  if (!credited.ok) {
    await CoursePurchase.findOneAndUpdate(
      { _id: purchaseId, instructorCreditTxId: lockToken },
      {
        $set: {
          instructorCreditTxId: null,
        },
      }
    );
    return { ok: false as const, error: credited.error || "Failed to credit instructor wallet" };
  }

  const txId = String(credited.transactionId || "");
  await CoursePurchase.findOneAndUpdate(
    { _id: purchaseId, instructorCreditTxId: lockToken },
    {
      $set: {
        instructorCreditTxId: txId,
        instructorCreditedAt: new Date(),
      },
    }
  );

  return { ok: true as const, transactionId: txId };
};

export async function listPublishedCourses(req: AuthedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const searchText = String(req.query.q || req.query.query || "").trim();
    const level = String(req.query.level || "All").trim();
    const category = String(req.query.type || req.query.category || "All").trim();
    const priceType = String(req.query.priceType || req.query.price || "All").trim();
    const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;
    const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(String(req.query.limit || "9"), 10) || 9));

    const filter: Record<string, unknown> = { status: "Published" };

    if (searchText) {
      const searchRegex = new RegExp(escapeRegex(searchText), "i");
      filter.$or = [
        { title: searchRegex },
        { subtitle: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { tags: searchRegex },
      ];
    }

    if (level && level !== "All") {
      filter.level = new RegExp(`^${escapeRegex(level)}$`, "i");
    }

    if (category && category !== "All") {
      filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
    }

    if (priceType === "Free") {
      filter.price = { $lte: 0 };
    } else if (priceType === "Paid") {
      filter.price = { $gt: 0 };
    }

    const query = Course.find(filter)
      .select("title subtitle thumbnailUrl category level language price currency tags totalLectures totalVideoSec createdAt")
      .populate("instructorId", "firstName lastName email avatarUrl")
      .sort({ createdAt: -1 });

    if (hasPagination) {
      query.skip((page - 1) * limit).limit(limit);
    }

    const [items, total] = await Promise.all([
      query.lean(),
      Course.countDocuments(filter),
    ]);

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
      total,
      page,
      limit: hasPagination ? limit : items.length,
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
              id: String(c.instructorId._id),
              name: [c.instructorId.firstName, c.instructorId.lastName].filter(Boolean).join(" ").trim(),
              email: c.instructorId.email,
              avatarUrl: c.instructorId.avatarUrl ?? null,
            }
          : undefined,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to load courses",
    });
  }
}

export async function getPublishedCourse(req: Request, res: Response) {
  try {
    const id = req.params.id;

    const c = await Course.findOne({ _id: id, status: "Published" })
      .populate("instructorId", "firstName lastName email avatarUrl bio createdAt")
      .lean();
    if (!c) return res.status(404).json({ message: "Course not found" });

    const instructorDoc = c.instructorId as any;
    const instructor = instructorDoc
      ? {
          id: String(instructorDoc._id),
          name: [instructorDoc.firstName, instructorDoc.lastName].filter(Boolean).join(" ").trim(),
          email: instructorDoc.email,
          avatarUrl: instructorDoc.avatarUrl ?? null,
          bio: typeof instructorDoc.bio === "string" ? instructorDoc.bio : "",
          joinedAt: instructorDoc.createdAt ?? null,
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

export async function initiateCoursePurchase(req: AuthedRequest, res: Response) {
  try {
    const courseId = String(req.params.id || "").trim();
    const userId = String(req.user?.id || "").trim();
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const returnUrl = String(req.body?.returnUrl || "").trim();
    const websiteUrl = String(req.body?.websiteUrl || "").trim();
    if (!returnUrl || !isValidHttpUrl(returnUrl)) {
      return res.status(400).json({ message: "Valid returnUrl is required" });
    }
    if (!websiteUrl || !isValidHttpUrl(websiteUrl)) {
      return res.status(400).json({ message: "Valid websiteUrl is required" });
    }

    const khaltiTestSecretKey = normalizeKhaltiSecretKey(process.env.KHALTI_TEST_SECRET_KEY ?? "");
    if (!khaltiTestSecretKey) {
      return res.status(500).json({ message: "Khalti test secret key is missing" });
    }

    const course = await Course.findOne({ _id: courseId, status: "Published" })
      .select("title price currency instructorId")
      .lean();
    if (!course) return res.status(404).json({ message: "Course not found" });

    const pricePaisa = coursePriceToPaisa((course as any).price);
    if (pricePaisa <= 0) {
      return res.status(400).json({ message: "This course is free. Please use enroll." });
    }

    const instructorId = String((course as any).instructorId || "").trim();
    if (!instructorId) {
      return res.status(400).json({ message: "Course instructor is not configured" });
    }

    const [alreadyEnrolled, alreadyPurchased, customer] = await Promise.all([
      Enrollment.findOne({ userId, courseId }).select("_id").lean(),
      CoursePurchase.findOne({ userId, courseId, status: "completed" }).select("_id").lean(),
      User.findById(userId).select("firstName lastName email").lean(),
    ]);

    if (alreadyEnrolled || alreadyPurchased) {
      return res.status(409).json({ message: "You are already enrolled in this course" });
    }

    const customerName =
      customer && `${String((customer as any).firstName || "")} ${String((customer as any).lastName || "")}`.trim();
    const customerEmail = customer ? String((customer as any).email || "").trim() : "";
    const customerInfo =
      (customerName && customerName.length > 0) || customerEmail
        ? {
            ...(customerName ? { name: customerName } : {}),
            ...(customerEmail ? { email: customerEmail } : {}),
          }
        : undefined;

    const purchaseOrderId = `course-${courseId}-${userId}-${Date.now()}`;
    const purchaseOrderName =
      String((course as any).title || "Course Purchase").trim().slice(0, 120) || "Course Purchase";

    const initiate = await axios.post(
      KHALTI_INITIATE_URL,
      {
        return_url: returnUrl,
        website_url: websiteUrl,
        amount: pricePaisa,
        purchase_order_id: purchaseOrderId,
        purchase_order_name: purchaseOrderName,
        ...(customerInfo ? { customer_info: customerInfo } : {}),
      },
      {
        headers: {
          Authorization: `Key ${khaltiTestSecretKey}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    const payload = initiate.data as Record<string, unknown>;
    const paymentUrl = String(payload.payment_url || "").trim();
    const pidx = String(payload.pidx || "").trim();

    if (!paymentUrl || !pidx) {
      return res.status(502).json({ message: "Khalti did not return a valid payment reference" });
    }

    const [usedInWalletTopup, usedInQuestionEscrow, existingPurchaseForPidx] = await Promise.all([
      WalletTransaction.findOne({
        type: "wallet_topup",
        status: "completed",
        "metadata.pidx": pidx,
      })
        .select("_id")
        .lean(),
      Question.findOne({
        isFastResponse: true,
        fastResponseEscrowSource: "khalti",
        fastResponseEscrowSourceRef: pidx,
      })
        .select("_id")
        .lean(),
      CoursePurchase.findOne({ pidx }).select("userId courseId").lean(),
    ]);

    if (usedInWalletTopup || usedInQuestionEscrow) {
      return res.status(409).json({ message: "This Khalti payment reference is already used" });
    }

    if (
      existingPurchaseForPidx &&
      (String((existingPurchaseForPidx as any).userId || "") !== userId ||
        String((existingPurchaseForPidx as any).courseId || "") !== courseId)
    ) {
      return res.status(409).json({ message: "This Khalti payment reference is already used" });
    }

    await CoursePurchase.findOneAndUpdate(
      { pidx },
      {
        $set: {
          userId,
          courseId,
          instructorId,
          provider: "khalti",
          status: "initiated",
          pricePaisa,
          paidAmountPaisa: 0,
          instructorSharePaisa: 0,
          platformFeePaisa: 0,
          paymentCompletedAt: null,
          instructorCreditTxId: null,
          instructorCreditedAt: null,
          metadata: {
            returnUrl,
            websiteUrl,
            purchaseOrderId,
            purchaseOrderName,
            coursePriceNpr: Number((course as any).price || 0),
            courseCurrency: String((course as any).currency || "NPR"),
            khaltiInit: {
              pidx,
              paymentUrl,
              expiresAt: payload.expires_at ?? null,
              expiresIn: payload.expires_in ?? null,
            },
          },
        },
      },
      { upsert: true, new: true }
    );

    return res.json({
      item: {
        pidx,
        paymentUrl,
        expiresAt: payload.expires_at ?? null,
        expiresIn: payload.expires_in ?? null,
      },
    });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return res.status(502).json({
        message: formatKhaltiError(error.response?.data) || error.message || "Failed to initiate Khalti payment",
      });
    }
    return res.status(500).json({ message: "Failed to initiate course purchase" });
  }
}

export async function verifyCoursePurchase(req: AuthedRequest, res: Response) {
  try {
    const courseId = String(req.params.id || "").trim();
    const userId = String(req.user?.id || "").trim();
    const pidx = String(req.body?.pidx || "").trim();

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!pidx) return res.status(400).json({ message: "pidx is required" });

    const khaltiTestSecretKey = normalizeKhaltiSecretKey(process.env.KHALTI_TEST_SECRET_KEY ?? "");
    if (!khaltiTestSecretKey) {
      return res.status(500).json({ message: "Khalti test secret key is missing" });
    }

    const course = await Course.findOne({ _id: courseId, status: "Published" })
      .select("title sections")
      .lean();
    if (!course) return res.status(404).json({ message: "Course not found" });

    const purchase = await CoursePurchase.findOne({ userId, courseId, pidx });
    if (!purchase) {
      return res.status(404).json({ message: "Purchase reference not found for this course" });
    }

    const [usedInWalletTopup, usedInQuestionEscrow] = await Promise.all([
      WalletTransaction.findOne({
        type: "wallet_topup",
        status: "completed",
        "metadata.pidx": pidx,
      })
        .select("_id")
        .lean(),
      Question.findOne({
        isFastResponse: true,
        fastResponseEscrowSource: "khalti",
        fastResponseEscrowSourceRef: pidx,
      })
        .select("_id")
        .lean(),
    ]);

    if (usedInWalletTopup || usedInQuestionEscrow) {
      return res.status(409).json({ message: "This Khalti payment reference is already used" });
    }

    const verifyAndReturnProgress = async () => {
      const payout = await ensureInstructorCreditForPurchase(purchase, String((course as any).title || "Course"));
      if (!payout.ok) {
        return res.status(500).json({
          message: payout.error || "Payment verified but instructor payout failed. Please retry verification.",
        });
      }

      const enrolled = await ensureCourseEnrollment(userId, courseId, course);
      if (!enrolled) return res.status(500).json({ message: "Failed to enroll after payment verification" });

      return res.json({
        item: {
          enrolled: true,
          ...enrolled.progress,
        },
      });
    };

    if (String(purchase.status || "") === "completed") {
      return await verifyAndReturnProgress();
    }

    const lookup = await axios.post(
      KHALTI_LOOKUP_URL,
      { pidx },
      {
        headers: {
          Authorization: `Key ${khaltiTestSecretKey}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    const lookupData = lookup.data as Record<string, unknown>;
    const status = String(lookupData.status || "");
    if (status !== "Completed") {
      return res.status(400).json({
        message: status ? `Payment status: ${status}` : "Payment is not completed",
      });
    }

    const paidAmountPaisa = asPaisa(lookupData.total_amount);
    const expectedPricePaisa = asPaisa(purchase.pricePaisa);
    if (expectedPricePaisa <= 0) {
      return res.status(400).json({ message: "Invalid purchase amount" });
    }
    if (paidAmountPaisa < expectedPricePaisa) {
      return res.status(400).json({ message: "Paid amount is lower than course price" });
    }

    const lookupOrderId = String(lookupData.purchase_order_id || "").trim();
    const expectedOrderId = String((purchase.metadata as any)?.purchaseOrderId || "").trim();
    if (lookupOrderId && expectedOrderId && lookupOrderId !== expectedOrderId) {
      return res.status(409).json({ message: "Payment reference does not match this purchase request" });
    }

    const instructorSharePaisa = Math.floor(expectedPricePaisa * 0.7);
    const platformFeePaisa = expectedPricePaisa - instructorSharePaisa;

    purchase.status = "completed";
    purchase.paidAmountPaisa = paidAmountPaisa;
    purchase.instructorSharePaisa = instructorSharePaisa;
    purchase.platformFeePaisa = platformFeePaisa;
    purchase.paymentCompletedAt = new Date();
    purchase.metadata = {
      ...(purchase.metadata && typeof purchase.metadata === "object" ? purchase.metadata : {}),
      khaltiLookup: {
        status,
        total_amount: paidAmountPaisa,
        transaction_id: lookupData.transaction_id ?? null,
      },
    };
    await purchase.save();

    return await verifyAndReturnProgress();
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return res.status(502).json({
        message: formatKhaltiError(error.response?.data) || error.message || "Failed to verify Khalti payment",
      });
    }
    return res.status(500).json({ message: "Failed to verify course purchase" });
  }
}

export async function enrollPublishedCourse(req: AuthedRequest, res: Response) {
  try {
    const courseId = String(req.params.id || "");
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const course = await Course.findOne({ _id: courseId, status: "Published" }).select("sections price").lean();
    if (!course) return res.status(404).json({ message: "Course not found" });

    let enrollment = await Enrollment.findOne({ userId, courseId });

    if (!enrollment && coursePriceToPaisa((course as any).price) > 0) {
      const hasCompletedPurchase = await CoursePurchase.findOne({
        userId,
        courseId,
        status: "completed",
      })
        .select("_id")
        .lean();

      if (!hasCompletedPurchase) {
        return res.status(402).json({
          message: "Please complete payment through Buy Now to enroll in this course",
        });
      }
    }

    if (!enrollment) {
      enrollment = await Enrollment.findOneAndUpdate(
        { userId, courseId },
        { $setOnInsert: { userId, courseId } },
        { upsert: true, new: true }
      );
    }
    if (!enrollment) return res.status(500).json({ message: "Failed to enroll" });

    const progress = await recalcCompletion(enrollment, course);

    return res.json({ item: { enrolled: true, ...progress } });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to enroll course",
    });
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
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to load course progress",
    });
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
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to complete lecture",
    });
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
  } catch (error) {
    if ((error as { code?: number } | null)?.code === 11000) {
      return res.status(409).json({ message: "You have already submitted a review for this course" });
    }
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to submit review",
    });
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
      // use the original image url if embedding fails
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
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to generate certificate",
    });
  }
}
