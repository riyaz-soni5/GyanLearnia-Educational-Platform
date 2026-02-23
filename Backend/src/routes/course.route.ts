import { Router } from "express";
import {
  completeCourseLecture,
  enrollPublishedCourse,
  getCourseCertificate,
  getMyCourseProgress,
  getPublishedCourse,
  getPublishedCourseQuiz,
  listPublishedCourses,
  submitPublishedCourseQuiz,
} from "../controllers/courses.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", listPublishedCourses);
router.get("/:id/quizzes/:quizId", getPublishedCourseQuiz);
router.post("/:id/quizzes/:quizId/submit", requireAuth, submitPublishedCourseQuiz);
router.post("/:id/enroll", requireAuth, enrollPublishedCourse);
router.get("/:id/progress", requireAuth, getMyCourseProgress);
router.post("/:id/lectures/:lectureId/complete", requireAuth, completeCourseLecture);
router.get("/:id/certificate", requireAuth, getCourseCertificate);
router.get("/:id", getPublishedCourse);

export default router;
