import { Router } from "express";
import {
  createQuestion,
  deleteQuestion,
  downvoteQuestion,
  getQuestion,
  listQuestions,
  updateQuestion,
  upvoteQuestion,
} from "../controllers/question.controller.js";
import {
  acceptAnswer,
  deleteAnswer,
  downvoteAnswer,
  listAnswers,
  postAnswer,
  updateAnswer,
  upvoteAnswer,
} from "../controllers/answer.controller.js";
import { getLeaderboard } from "../controllers/leaderboard.controller.js";
import {
  deleteReply,
  downvoteReply,
  listReplies,
  postReply,
  updateReply,
  upvoteReply,
} from "../controllers/reply.controller.js";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", optionalAuth, listQuestions);
router.get("/leaderboard", getLeaderboard);
router.get("/:id", optionalAuth, getQuestion);

router.post("/", requireAuth, createQuestion);

router.get("/:id/answers", optionalAuth, listAnswers);
router.post("/:id/answers", requireAuth, postAnswer);

// Replies
router.get("/:id/answers/:answerId/replies", optionalAuth, listReplies);
router.post("/:id/answers/:answerId/replies", requireAuth, postReply);

router.patch("/:id/answers/:answerId/replies/:replyId", requireAuth, updateReply);
router.delete("/:id/answers/:answerId/replies/:replyId", requireAuth, deleteReply);

router.post("/:id/answers/:answerId/replies/:replyId/upvote", requireAuth, upvoteReply);
router.post("/:id/answers/:answerId/replies/:replyId/downvote", requireAuth, downvoteReply);

router.post("/:id/answers/:answerId/accept", requireAuth, acceptAnswer);
router.patch("/:id/answers/:answerId", requireAuth, updateAnswer);
router.delete("/:id/answers/:answerId", requireAuth, deleteAnswer);
router.post("/:id/answers/:answerId/upvote", requireAuth, upvoteAnswer);
router.post("/:id/answers/:answerId/downvote", requireAuth, downvoteAnswer);

router.patch("/:id", requireAuth, updateQuestion);
router.delete("/:id", requireAuth, deleteQuestion);

router.post("/:id/upvote", requireAuth, upvoteQuestion);
router.post("/:id/downvote", requireAuth, downvoteQuestion);

export default router;
