// controllers/answer.controller.ts
import { Response } from "express";
import Answer from "../models/Answer.model.js";
import Question from "../models/Question.model.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import User from "../models/User.model.js"; // ✅ add

const ACCEPT_POINTS = 15;

// GET /api/questions/:id/answers
export const listAnswers = async (req: AuthedRequest, res: Response) => {
  try {
    const { id: questionId } = req.params;

    const answers = await Answer.find({ questionId })
      .sort({ isVerified: -1, votes: -1, createdAt: -1 }) // verified first, then top votes
      .populate("authorId", "firstName lastName role email avatarUrl")
      .lean();

    // return in a frontend-friendly shape
    const meId = req.user?.id ? String(req.user.id) : null;

    const items = answers.map((a: any) => {
      const myVote =
        meId
          ? (a.voters?.find((v: any) => String(v.userId) === meId)?.value ?? null)
          : null;

      return {
        id: String(a._id),
        questionId: String(a.questionId),
        content: a.content,
        votes: a.votes,
        myVote, // IMPORTANT
        isVerified: a.isVerified,
        createdAt: a.createdAt,
        authorId: a.authorId?._id ? String(a.authorId._id) : undefined,
        author: a.authorId
          ? `${a.authorId.firstName ?? ""} ${a.authorId.lastName ?? ""}`.trim() || a.authorId.email
          : "Unknown",
        authorType: a.authorId?.role ?? "student",
        authorAvatarUrl: a.authorId?.avatarUrl ?? null,
      };
    });

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
    const authorDoc = await User.findById(req.user.id)
      .select("firstName lastName role email avatarUrl")
      .lean();

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
        authorAvatarUrl: authorDoc?.avatarUrl ?? null,
      },
      authorId: String(req.user.id),
      author:
        [authorDoc?.firstName, authorDoc?.lastName].filter(Boolean).join(" ").trim() ||
        authorDoc?.email ||
        "You",
      authorType: (authorDoc as any)?.role ?? req.user.role ?? "student",
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

    const isOwner = String(q.authorId) === String(req.user.id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only the question owner can accept an answer" });
    }

    const ans = await Answer.findOne({ _id: answerId, questionId });
    if (!ans) return res.status(404).json({ message: "Answer not found" });

    const prevAcceptedId = q.acceptedAnswerId ? String(q.acceptedAnswerId) : null;
    const nextAcceptedId = String(ans._id);

    // ✅ If clicking the same accepted answer again -> toggle OFF (optional but nice UX)
    if (prevAcceptedId && prevAcceptedId === nextAcceptedId) {
      await Answer.updateOne({ _id: ans._id }, { $set: { isVerified: false } });

      // remove points from that author (optional but fair)
      await User.updateOne(
        { _id: ans.authorId },
        { $inc: { points: -ACCEPT_POINTS, acceptedAnswers: -1 } }
      );

      q.acceptedAnswerId = null as any;
      q.hasVerifiedAnswer = false;
      await q.save();

      return res.json({
        message: "Answer unaccepted",
        acceptedAnswerId: null,
        hasVerifiedAnswer: false,
      });
    }

    // ✅ unverify old accepted if exists
    if (q.acceptedAnswerId) {
      const prev = await Answer.findById(q.acceptedAnswerId).lean();
      await Answer.updateOne({ _id: q.acceptedAnswerId }, { $set: { isVerified: false } });

      // remove points from previous author (only if it exists)
      if (prev?.authorId) {
        await User.updateOne(
          { _id: prev.authorId },
          { $inc: { points: -ACCEPT_POINTS, acceptedAnswers: -1 } }
        );
      }
    }

    // ✅ verify this answer
    await Answer.updateOne({ _id: ans._id }, { $set: { isVerified: true } });

    // ✅ award points to new accepted answer author
    await User.updateOne(
      { _id: ans.authorId },
      { $inc: { points: ACCEPT_POINTS, acceptedAnswers: 1 } }
    );

    // ✅ update question solved state
    q.acceptedAnswerId = ans._id as any;
    q.hasVerifiedAnswer = true;
    await q.save();

    return res.json({
      message: "Answer accepted",
      acceptedAnswerId: String(ans._id),
      hasVerifiedAnswer: true,
    });
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


// ✅ helper: apply vote switch / toggle
const applyVote = (existing: number | null, next: 1 | -1) => {
  // returns: { newValue, delta }
  // delta = how much to change cached votes by
  if (existing === next) {
    // toggle off
    return { newValue: null, delta: -next };
  }
  if (existing === null) {
    // new vote
    return { newValue: next, delta: next };
  }
  // switch from -1 to +1 or +1 to -1
  // example: existing=-1 next=+1 => delta = +2
  return { newValue: next, delta: next - existing };
};



// POST /api/questions/:id/answers/:answerId/upvote
export const upvoteAnswer = async (req: AuthedRequest, res: Response) => {
  try {
    const { id: questionId, answerId } = req.params as any;
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const ans: any = await Answer.findOne({ _id: answerId, questionId });
    if (!ans) return res.status(404).json({ message: "Answer not found" });


    const userId = String(req.user.id);

    const idx = ans.voters.findIndex((v: any) => String(v.userId) === userId);
    const existing = idx >= 0 ? Number(ans.voters[idx].value) : null;

    const { newValue, delta } = applyVote(existing, 1);

    if (newValue === null) {
      // remove vote
      ans.voters = ans.voters.filter((v: any) => String(v.userId) !== userId);
    } else if (idx >= 0) {
      // update vote
      ans.voters[idx].value = newValue;
    } else {
      // add vote
      ans.voters.push({ userId: req.user.id, value: newValue });
    }

    ans.votes = Math.max(0, Number(ans.votes || 0) + delta); // keep non-negative (optional)
    await ans.save();

    return res.json({ message: "Voted", votes: ans.votes, myVote: newValue });
  } catch {
    return res.status(500).json({ message: "Failed to upvote answer" });
  }
};

// POST /api/questions/:id/answers/:answerId/downvote
export const downvoteAnswer = async (req: AuthedRequest, res: Response) => {
  try {
    const { id: questionId, answerId } = req.params as any;
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const ans: any = await Answer.findOne({ _id: answerId, questionId });
    if (!ans) return res.status(404).json({ message: "Answer not found" });

    const userId = String(req.user.id);

    const idx = ans.voters.findIndex((v: any) => String(v.userId) === userId);
    const existing = idx >= 0 ? Number(ans.voters[idx].value) : null;

    const { newValue, delta } = applyVote(existing, -1);

    if (newValue === null) {
      ans.voters = ans.voters.filter((v: any) => String(v.userId) !== userId);
    } else if (idx >= 0) {
      ans.voters[idx].value = newValue;
    } else {
      ans.voters.push({ userId: req.user.id, value: newValue });
    }

    ans.votes = Math.max(0, Number(ans.votes || 0) + delta); // keep non-negative (optional)
    await ans.save();

    return res.json({ message: "Voted", votes: ans.votes, myVote: newValue });
  } catch {
    return res.status(500).json({ message: "Failed to downvote answer" });
  }
};
