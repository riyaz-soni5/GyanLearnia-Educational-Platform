// controllers/question.controller.ts
import { Request, Response } from "express";
import Question from "../models/Question.model.js";

export const listQuestions = async (req: Request, res: Response) => {
  const { query = "", subject = "All", level = "All", sort = "Newest", page = "1", limit = "10" } = req.query;

  const q = String(query).trim();
  const filter: any = {};

  if (q) filter.$or = [{ title: new RegExp(q, "i") }, { excerpt: new RegExp(q, "i") }];
  if (subject !== "All") filter.subject = subject;
  if (level !== "All") filter.level = level;

  const skip = (Number(page) - 1) * Number(limit);

  const sortObj =
    sort === "Most Viewed" ? { views: -1 } :
    sort === "Most Voted" ? { votes: -1 } :
    sort === "Unanswered" ? { answersCount: 1, createdAt: -1 } :
    { createdAt: -1 };

  const [items, total] = await Promise.all([
    Question.find(filter).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
    Question.countDocuments(filter),
  ]);

  res.json({ items, total, page: Number(page), limit: Number(limit) });
};

export const getQuestion = async (req: Request, res: Response) => {
  const { id } = req.params;

  const question = await Question.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true }
  ).lean();

  if (!question) return res.status(404).json({ message: "Question not found" });
  res.json(question);
};