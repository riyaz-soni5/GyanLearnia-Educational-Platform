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
} from "../controllers/answer.controller.js";

const router = Router();

router.get("/", listQuestions);
router.get("/:id", getQuestion);

router.post("/", requireAuth, createQuestion);

router.get("/:id/answers", listAnswers);
router.post("/:id/answers", requireAuth, postAnswer);

router.post("/:id/answers/:answerId/accept", requireAuth, acceptAnswer);
router.patch("/:id/answers/:answerId", requireAuth, updateAnswer);
router.delete("/:id/answers/:answerId", requireAuth, deleteAnswer);

router.patch("/:id", requireAuth, updateQuestion);
router.delete("/:id", requireAuth, deleteQuestion);

export default router;