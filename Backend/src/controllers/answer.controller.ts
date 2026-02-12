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
export const postAnswer = async (req: AuthedRequest, res: Response) => {
  try {
    const { id: questionId } = req.params;
    const { content } = req.body;

    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });
    if (!content || String(content).trim().length < 10) {
      return res.status(400).json({ message: "Answer must be at least 10 characters" });
    }

    // ensure question exists
    const q = await Question.findById(questionId);
    if (!q) return res.status(404).json({ message: "Question not found" });

    const answer = await Answer.create({
      questionId,
      authorId: req.user.id,
      content: String(content).trim(),
    });

    // update cached count
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
  } catch (err) {
    return res.status(500).json({ message: "Failed to post answer" });
  }
};