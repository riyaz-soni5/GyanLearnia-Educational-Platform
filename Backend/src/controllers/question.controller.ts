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

export const getQuestion = async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;

  const userId = req.user?.id;

  const ipRaw =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    "";
  const ip = String(ipRaw).split(",")[0].trim();
  const ua = String(req.headers["user-agent"] || "");
  const guestKey = `${ip}::${ua}`;

  let q: any = null;

  // ✅ Logged-in user logic
  if (userId) {
    q = await Question.findOneAndUpdate(
      {
        _id: id,
        authorId: { $ne: userId },   // owner view should NOT count
        viewedBy: { $ne: userId },   // already viewed should NOT count
      },
      {
        $inc: { views: 1 },
        $addToSet: { viewedBy: userId },
      },
      { new: true }
    )
      .populate("categoryId", "name")
      .populate("authorId", "firstName lastName fullName name username role")
      .lean();
  } 
  // ✅ Guest logic
  else {
    q = await Question.findOneAndUpdate(
      {
        _id: id,
        viewedKeys: { $ne: guestKey },
      },
      {
        $inc: { views: 1 },
        $addToSet: { viewedKeys: guestKey },
      },
      { new: true }
    )
      .populate("categoryId", "name")
      .populate("authorId", "firstName lastName fullName name username role")
      .lean();
  }

  // If not incremented, just fetch normally
  if (!q) {
    q = await Question.findById(id)
      .populate("categoryId", "name")
      .populate("authorId", "firstName lastName fullName name username role")
      .lean();
  }

  if (!q) return res.status(404).json({ message: "Question not found" });
  const meId = req.user?.id ? String(req.user.id) : null;

const myVote =
  meId
    ? (q.voters?.find((v: any) => String(v.userId) === meId)?.value ?? null)
    : null;

  const authorObj = q.authorId as any;

  const authorName =
    authorObj?.firstName && authorObj?.lastName
      ? `${authorObj.firstName} ${authorObj.lastName}`
      : authorObj?.fullName ||
        authorObj?.name ||
        authorObj?.username ||
        "Anonymous";

  const authorType = authorObj?.role || "student";

  return res.json({
    item: {
      id: String(q._id),
      title: q.title,
      excerpt: q.excerpt,

      categoryId: q.categoryId?._id
        ? String(q.categoryId._id)
        : String(q.categoryId),
      categoryName: q.categoryId?.name,

      level: q.level,
      tags: q.tags ?? [],

      votes: q.votes ?? 0,
      myVote,
      views: q.views ?? 0,
      answersCount: q.answersCount ?? 0,
      isFastResponse: q.isFastResponse ?? false,
      hasVerifiedAnswer: q.hasVerifiedAnswer ?? false,
      acceptedAnswerId: q.acceptedAnswerId ?? null,

      status: q.hasVerifiedAnswer ? "Answered" : "Unanswered",

      createdAt: q.createdAt ? new Date(q.createdAt).toISOString() : undefined,
      updatedAt: q.updatedAt ? new Date(q.updatedAt).toISOString() : undefined,

      author: authorName,
      authorType,

      authorId: authorObj?._id
        ? String(authorObj._id)
        : String(q.authorId),
    },
  });
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


const applyVote = (existing: number | null, next: 1 | -1) => {
  if (existing === next) return { newValue: null, delta: -next };
  if (existing === null) return { newValue: next, delta: next };
  return { newValue: next, delta: next - existing };
};

// POST /api/questions/:id/upvote
export const upvoteQuestion = async (req: AuthedRequest, res: Response) => {
  try {
    const { id: questionId } = req.params;
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const q: any = await Question.findById(questionId);
    if (!q) return res.status(404).json({ message: "Question not found" });

    const userId = String(req.user.id);

    const idx = q.voters.findIndex((v: any) => String(v.userId) === userId);
    const existing = idx >= 0 ? Number(q.voters[idx].value) : null;

    const { newValue, delta } = applyVote(existing, 1);

    if (newValue === null) {
      q.voters = q.voters.filter((v: any) => String(v.userId) !== userId);
    } else if (idx >= 0) {
      q.voters[idx].value = newValue;
    } else {
      q.voters.push({ userId: req.user.id, value: newValue });
    }

    q.votes = Number(q.votes || 0) + delta;
    await q.save();

    return res.json({ message: "Voted", votes: q.votes, myVote: newValue });
  } catch {
    return res.status(500).json({ message: "Failed to upvote question" });
  }
};

// POST /api/questions/:id/downvote
export const downvoteQuestion = async (req: AuthedRequest, res: Response) => {
  try {
    const { id: questionId } = req.params;
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const q: any = await Question.findById(questionId);
    if (!q) return res.status(404).json({ message: "Question not found" });

    const userId = String(req.user.id);

    const idx = q.voters.findIndex((v: any) => String(v.userId) === userId);
    const existing = idx >= 0 ? Number(q.voters[idx].value) : null;

    const { newValue, delta } = applyVote(existing, -1);

    if (newValue === null) {
      q.voters = q.voters.filter((v: any) => String(v.userId) !== userId);
    } else if (idx >= 0) {
      q.voters[idx].value = newValue;
    } else {
      q.voters.push({ userId: req.user.id, value: newValue });
    }

    q.votes = Number(q.votes || 0) + delta;
    await q.save();

    return res.json({ message: "Voted", votes: q.votes, myVote: newValue });
  } catch {
    return res.status(500).json({ message: "Failed to downvote question" });
  }
};