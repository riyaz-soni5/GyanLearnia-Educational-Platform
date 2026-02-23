import { Router } from "express";
import { getPublishedCourse, getPublishedCourseQuiz, listPublishedCourses, submitPublishedCourseQuiz, } from "../controllers/courses.controller.js";
const router = Router();
router.get("/", listPublishedCourses);
router.get("/:id/quizzes/:quizId", getPublishedCourseQuiz);
router.post("/:id/quizzes/:quizId/submit", submitPublishedCourseQuiz);
router.get("/:id", getPublishedCourse);
export default router;
