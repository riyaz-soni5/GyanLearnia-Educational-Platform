// routes/question.route.ts
import { Router } from "express";
import {
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../controllers/question.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  listAnswers,
  postAnswer,
  acceptAnswer,
  updateAnswer,
  deleteAnswer,
  upvoteAnswer,     // ✅ NEW
  downvoteAnswer,   // ✅ NEW
} from "../controllers/answer.controller.js";
import { upvoteQuestion, downvoteQuestion } from "../controllers/question.controller.js";
import {
  listReplies,
  postReply,
  updateReply,
  deleteReply,
  upvoteReply,
  downvoteReply,
} from "../controllers/reply.controller.js";


import { optionalAuth } from "../middlewares/auth.middleware.js";
import { getLeaderboard } from "../controllers/leaderboard.controller.js"; // ✅ NEW

const router = Router();

router.get("/", listQuestions);
router.get("/leaderboard", getLeaderboard); // ✅ NEW (must be before "/:id" routes ideally)
router.get("/:id", optionalAuth, getQuestion);

router.post("/", requireAuth, createQuestion);

router.get("/:id/answers", optionalAuth, listAnswers);
router.post("/:id/answers", requireAuth, postAnswer);

// Replies (Reddit-style threads)
router.get("/:id/answers/:answerId/replies", optionalAuth, listReplies);
router.post("/:id/answers/:answerId/replies", requireAuth, postReply);

router.patch("/:id/answers/:answerId/replies/:replyId", requireAuth, updateReply);
router.delete("/:id/answers/:answerId/replies/:replyId", requireAuth, deleteReply);

router.post("/:id/answers/:answerId/replies/:replyId/upvote", requireAuth, upvoteReply);
router.post("/:id/answers/:answerId/replies/:replyId/downvote", requireAuth, downvoteReply);

router.post("/:id/answers/:answerId/accept", requireAuth, acceptAnswer);
router.patch("/:id/answers/:answerId", requireAuth, updateAnswer);
router.delete("/:id/answers/:answerId", requireAuth, deleteAnswer);

// ✅ NEW: votes
router.post("/:id/answers/:answerId/upvote", requireAuth, upvoteAnswer);
router.post("/:id/answers/:answerId/downvote", requireAuth, downvoteAnswer);

router.patch("/:id", requireAuth, updateQuestion);
router.delete("/:id", requireAuth, deleteQuestion);

router.post("/:id/upvote", requireAuth, upvoteQuestion);
router.post("/:id/downvote", requireAuth, downvoteQuestion);



export default router;