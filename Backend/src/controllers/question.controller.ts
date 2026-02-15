// controllers/question.controller.ts
import { Request, Response } from "express";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import type { SortOrder } from "mongoose";
import Question from "../models/Question.model.js";

export const listQuestions = async (req: Request, res: Response) => {
  const { query = "", categoryId = "All", level = "All", sort = "Newest", page = "1", limit = "10" } = req.query;

  const q = String(query).trim();
  const filter: any = {};

  if (q) filter.$or = [{ title: new RegExp(q, "i") }, { excerpt: new RegExp(q, "i") }];
  if (categoryId !== "All") filter.categoryId = categoryId;
  if (level !== "All") filter.level = level;

  const skip = (Number(page) - 1) * Number(limit);

  const sortObj: Record<string, SortOrder> =
  sort === "Most Viewed" ? { views: -1 } :
  sort === "Most Voted" ? { votes: -1 } :
  sort === "Unanswered" ? { answersCount: 1, createdAt: -1 } :
  { createdAt: -1 };

  const [items, total] = (await Promise.all([
  Question.find(filter)
    .sort(sortObj)
    .skip(skip)
    .limit(Number(limit))
    .populate("categoryId", "name")
    .populate("authorId", "firstName lastName fullName name username role")
    .lean(),
  Question.countDocuments(filter),
])) as any;

  const mapped = items.map((q: any) => {
  const authorObj = q.authorId as any;

  return {
    id: String(q._id),
    title: q.title,
    excerpt: q.excerpt,

    categoryId: q.categoryId?._id
      ? String(q.categoryId._id)
      : q.categoryId
      ? String(q.categoryId)
      : undefined,
    categoryName: q.categoryId?.name,

    level: q.level,
    tags: q.tags ?? [],

    votes: q.votes ?? 0,
    views: q.views ?? 0,
    answersCount: q.answersCount ?? 0,
    isFastResponse: q.isFastResponse ?? false,
    hasVerifiedAnswer: q.hasVerifiedAnswer ?? false,

    status: q.hasVerifiedAnswer ? "Answered" : "Unanswered",

    createdAt: q.createdAt
      ? new Date(q.createdAt).toISOString()
      : undefined,
    updatedAt: q.updatedAt
      ? new Date(q.updatedAt).toISOString()
      : undefined,
      author:
  authorObj?.firstName && authorObj?.lastName
    ? `${authorObj.firstName} ${authorObj.lastName}`
    : authorObj?.fullName ||
      authorObj?.name ||
      authorObj?.username ||
      "Anonymous",

authorType: authorObj?.role || "student",
  };
});

res.json({ items: mapped, total, page: Number(page), limit: Number(limit) });
};

export const getQuestion = async (req: Request, res: Response) => {
  const { id } = req.params;

  const q = (await Question.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate("categoryId", "name")
    .populate("authorId", "firstName lastName fullName name username role")
    .lean()) as any;

  if (!q) return res.status(404).json({ message: "Question not found" });

  const authorObj = q.authorId as any;

  // ✅ move these OUTSIDE the object
  const authorName =
  authorObj?.firstName && authorObj?.lastName
    ? `${authorObj.firstName} ${authorObj.lastName}`
    : authorObj?.fullName ||
      authorObj?.name ||
      authorObj?.username ||
      "Anonymous";

  const authorType =
    authorObj?.role || "student";

  const item = {
    id: String(q._id),
    title: q.title,
    excerpt: q.excerpt,

    categoryId: q.categoryId?._id
      ? String(q.categoryId._id)
      : q.categoryId
      ? String(q.categoryId)
      : undefined,
    categoryName: q.categoryId?.name,

    level: q.level,
    tags: q.tags ?? [],
    votes: q.votes ?? 0,
    views: q.views ?? 0,
    answersCount: q.answersCount ?? 0,
    isFastResponse: q.isFastResponse ?? false,
    hasVerifiedAnswer: q.hasVerifiedAnswer ?? false,

    status: q.hasVerifiedAnswer ? "Answered" : "Unanswered",

    createdAt: q.createdAt
      ? new Date(q.createdAt).toISOString()
      : undefined,
    updatedAt: q.updatedAt
      ? new Date(q.updatedAt).toISOString()
      : undefined,

    author: authorName,
    authorType,

    authorId: authorObj?._id
      ? String(authorObj._id)
      : q.authorId
      ? String(q.authorId)
      : undefined,
  };

  return res.json({ item });
};


export const createQuestion = async (req: AuthedRequest, res: Response) => {
  const { title, excerpt, categoryId, level, tags = [], isFastResponse = false } = req.body || {};

  if (!title || title.trim().length < 10) {
    return res.status(400).json({ message: "Title must be at least 10 characters." });
  }
  if (!excerpt || excerpt.trim().length < 20) {
    return res.status(400).json({ message: "Question details must be at least 20 characters." });
  }
  if (!categoryId) return res.status(400).json({ message: "Category is required." });
  if (!level) return res.status(400).json({ message: "Level is required." });

  const userId = req.user?.id; // from requireAuth middleware

  const doc = await Question.create({
    title: title.trim(),
    excerpt: excerpt.trim(),
    categoryId,
    level,
    tags: Array.isArray(tags) ? tags.slice(0, 8) : [],
    isFastResponse: Boolean(isFastResponse),
    authorId: userId,
  });

  return res.status(201).json({
    message: "Question created",
    item: {
      id: String(doc._id),
      authorId: String(doc.authorId),
      title: doc.title,
      excerpt: doc.excerpt,
      categoryId: String(doc.categoryId),
      level: doc.level,
      tags: doc.tags,
      isFastResponse: doc.isFastResponse,
      createdAt: doc.createdAt,
    },
  });
};


export const updateQuestion = async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const { title, excerpt } = req.body || {};

  if (title && String(title).trim().length < 10) {
    return res.status(400).json({ message: "Title must be at least 10 characters." });
  }
  if (excerpt && String(excerpt).trim().length < 20) {
    return res.status(400).json({ message: "Question details must be at least 20 characters." });
  }

  const q = await Question.findById(id);
  if (!q) return res.status(404).json({ message: "Question not found" });

  // ✅ only owner can edit
  if (String(q.authorId) !== String(req.user?.id)) {
    return res.status(403).json({ message: "Not allowed" });
  }

  if (title !== undefined) q.title = String(title).trim();
  if (excerpt !== undefined) q.excerpt = String(excerpt).trim();

  await q.save();

  return res.json({
    message: "Question updated",
    item: {
      id: String(q._id),
      title: q.title,
      excerpt: q.excerpt,
      categoryId: String(q.categoryId),
      level: q.level,
      tags: q.tags ?? [],
      isFastResponse: q.isFastResponse ?? false,
      votes: q.votes ?? 0,
      views: q.views ?? 0,
      answersCount: q.answersCount ?? 0,
      hasVerifiedAnswer: q.hasVerifiedAnswer ?? false,
      status: q.hasVerifiedAnswer ? "Answered" : "Unanswered",
      createdAt: q.createdAt ? new Date(q.createdAt).toISOString() : undefined,
      updatedAt: q.updatedAt ? new Date(q.updatedAt).toISOString() : undefined,
      authorId: String(q.authorId),
    },
  });
};

export const deleteQuestion = async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;

  const q = await Question.findById(id);
  if (!q) return res.status(404).json({ message: "Question not found" });

  if (String(q.authorId) !== String(req.user?.id)) {
    return res.status(403).json({ message: "Not allowed" });
  }

  await Question.findByIdAndDelete(id);

  return res.json({ message: "Question deleted" });
};