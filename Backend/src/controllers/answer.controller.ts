// controllers/answer.controller.ts
import { Response } from "express";
import Answer from "../models/Answer.model.js";
import Question from "../models/Question.model.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";

// GET /api/questions/:id/answers
export const listAnswers = async (req: AuthedRequest, res: Response) => {
  try {
    const { id: questionId } = req.params;

    const answers = await Answer.find({ questionId })
      .sort({ isVerified: -1, votes: -1, createdAt: -1 }) // verified first, then top votes
      .populate("authorId", "firstName lastName role email")
      .lean();

    // return in a frontend-friendly shape
    const items = answers.map((a: any) => ({
      id: a._id,
      questionId: a.questionId,
      content: a.content,
      votes: a.votes,
      isVerified: a.isVerified,
      createdAt: a.createdAt,
      authorId: a.authorId?._id ? String(a.authorId._id) : undefined,
      author: a.authorId
        ? `${a.authorId.firstName ?? ""} ${a.authorId.lastName ?? ""}`.trim() || a.authorId.email
        : "Unknown",
      authorType: a.authorId?.role ?? "student",
    }));

    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load answers" });
  }
};

// POST /api/questions/:id/answers (requireAuth)
// controllers/answer.controller.ts
export const postAnswer = async (req: AuthedRequest, res: Response) => {
  try {
    const { id: questionId } = req.params;
    const { content } = req.body;

    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });
    if (!content || String(content).trim().length < 10) {
      return res.status(400).json({ message: "Answer must be at least 10 characters" });
    }

    const q = await Question.findById(questionId);
    if (!q) return res.status(404).json({ message: "Question not found" });

    // ✅ 1) question owner cannot answer
    if (String(q.authorId) === String(req.user.id)) {
      return res.status(403).json({ message: "You cannot answer your own question" });
    }

    // ✅ 2) only one answer per user per question
    const existing = await Answer.findOne({ questionId, authorId: req.user.id });
    if (existing) {
      return res.status(409).json({ message: "You already answered. Delete your answer to answer again." });
    }

    const answer = await Answer.create({
      questionId,
      authorId: req.user.id,
      content: String(content).trim(),
    });

    // ✅ update cached count only (DO NOT mark as answered here)
    await Question.findByIdAndUpdate(questionId, { $inc: { answersCount: 1 } });

    return res.status(201).json({
      message: "Answer posted",
      answer: {
        id: answer._id,
        questionId: answer.questionId,
        content: answer.content,
        votes: answer.votes,
        isVerified: answer.isVerified,
        createdAt: answer.createdAt,
      },
    });
  } catch (err: any) {
    // ✅ handle unique index conflict gracefully if you add the index
    if (err?.code === 11000) {
      return res.status(409).json({ message: "You already answered. Delete your answer to answer again." });
    }
    return res.status(500).json({ message: "Failed to post answer" });
  }
};

// POST /api/questions/:id/answers/:answerId/accept (requireAuth)
export const acceptAnswer = async (req: AuthedRequest, res: Response) => {
  try {
    const { id: questionId, answerId } = req.params as any;

    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const q = await Question.findById(questionId);
    if (!q) return res.status(404).json({ message: "Question not found" });

    // ✅ only question owner (or admin) can accept
    const isOwner = String(q.authorId) === String(req.user.id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only the question owner can accept an answer" });
    }

    const ans = await Answer.findOne({ _id: answerId, questionId });
    if (!ans) return res.status(404).json({ message: "Answer not found" });

    // ✅ unverify old accepted if exists
    if (q.acceptedAnswerId) {
      await Answer.updateOne({ _id: q.acceptedAnswerId }, { $set: { isVerified: false } });
    }

    // ✅ verify this answer
    await Answer.updateOne({ _id: answerId }, { $set: { isVerified: true } });

    // ✅ update question solved state
    q.acceptedAnswerId = ans._id as any;
    q.hasVerifiedAnswer = true;
    await q.save();

    return res.json({ message: "Answer accepted" });
  } catch {
    return res.status(500).json({ message: "Failed to accept answer" });
  }
};


// PATCH /api/questions/:id/answers/:answerId (requireAuth)
export const updateAnswer = async (req: AuthedRequest, res: Response) => {
  try {
    const { id: questionId, answerId } = req.params as any;
    const { content } = req.body;

    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });
    if (!content || String(content).trim().length < 10) {
      return res.status(400).json({ message: "Answer must be at least 10 characters" });
    }

    const ans = await Answer.findOne({ _id: answerId, questionId });
    if (!ans) return res.status(404).json({ message: "Answer not found" });

    const isOwner = String(ans.authorId) === String(req.user.id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not allowed" });
    }

    ans.content = String(content).trim();
    await ans.save();

    return res.json({
      message: "Answer updated",
      answer: {
        id: ans._id,
        questionId: ans.questionId,
        content: ans.content,
        votes: ans.votes,
        isVerified: ans.isVerified,
        createdAt: ans.createdAt,
        updatedAt: ans.updatedAt,
      },
    });
  } catch {
    return res.status(500).json({ message: "Failed to update answer" });
  }
};


// DELETE /api/questions/:id/answers/:answerId (requireAuth)
export const deleteAnswer = async (req: AuthedRequest, res: Response) => {
  try {
    const { id: questionId, answerId } = req.params as any;

    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const ans = await Answer.findOne({ _id: answerId, questionId });
    if (!ans) return res.status(404).json({ message: "Answer not found" });

    const isOwner = String(ans.authorId) === String(req.user.id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // If this answer was accepted, un-accept it on the question too
    const q = await Question.findById(questionId);
    if (q && String((q as any).acceptedAnswerId || "") === String(ans._id)) {
      (q as any).acceptedAnswerId = undefined;
      q.hasVerifiedAnswer = false;
      await q.save();
    }

    await Answer.deleteOne({ _id: answerId });

    // decrease cached count (protect from going negative)
    await Question.findByIdAndUpdate(questionId, { $inc: { answersCount: -1 } });

    // safer simple version (recommended) — replace the above block with this if needed:
    // await Question.findByIdAndUpdate(questionId, { $inc: { answersCount: -1 } });

    return res.json({ message: "Answer deleted" });
  } catch {
    return res.status(500).json({ message: "Failed to delete answer" });
  }
};