// controllers/leaderboard.controller.ts
import { Request, Response } from "express";
import User from "../models/User.model.js";
import Answer from "../models/Answer.model.js";

export const getLeaderboard = async (_req: Request, res: Response) => {
  try {
    // answers count per user
    const answersAgg = await Answer.aggregate([
      { $group: { _id: "$authorId", answers: { $sum: 1 } } },
    ]);

    const answersMap = new Map<string, number>();
    for (const row of answersAgg) {
      answersMap.set(String(row._id), Number(row.answers || 0));
    }

    const users = await User.find({})
        .select("firstName lastName email role points updatedAt")
        .sort({ points: -1, updatedAt: -1 })
        .limit(20)
        .lean();

    const items = users.map((u: any) => {
      const name =
        `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || "User";

      const role =
        String(u.role) === "instructor" ? "Instructor" : "Student";

      return {
        id: String(u._id),
        name,
        role,
        points: Number(u.points || 0),
        answers: Number(answersMap.get(String(u._id)) || 0),
      };
    });

    return res.json({ items, range: "All Time" });
  } catch {
    return res.status(500).json({ message: "Failed to load leaderboard" });
  }
};