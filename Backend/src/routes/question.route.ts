import { Router } from "express";
import {
  listQuestions,
  getQuestion,
  createQuestion, // ✅ add
} from "../controllers/question.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { listAnswers, postAnswer } from "../controllers/answer.controller.js";

const router = Router();

router.get("/", listQuestions);
router.get("/:id", getQuestion);


router.post("/", requireAuth, createQuestion);

router.get("/:id/answers", listAnswers);
router.post("/:id/answers", requireAuth, postAnswer);

export default router;