import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { requireVerifiedInstructor } from "../middlewares/requireVerifiedInstructor.middleware.js";
import {
  getInstructorAnalytics,
  createInstructorCourse,
  deleteInstructorCourse,
  getInstructorEarnings,
  getInstructorCourseById,
  listInstructorCourses,
  resubmitInstructorCourse,
} from "../controllers/instructor.courses.controller.js";

const router = Router();

router.get("/mine", requireAuth, requireRole("instructor"), listInstructorCourses);
router.get("/analytics", requireAuth, requireRole("instructor"), getInstructorAnalytics);
router.get("/earnings", requireAuth, requireRole("instructor"), getInstructorEarnings);
router.get("/:id", requireAuth, requireRole("instructor"), getInstructorCourseById);
router.post("/", requireAuth, requireRole("instructor"), requireVerifiedInstructor, createInstructorCourse);
router.put(
  "/:id/resubmit",
  requireAuth,
  requireRole("instructor"),
  requireVerifiedInstructor,
  resubmitInstructorCourse
);
router.delete("/:id", requireAuth, requireRole("instructor"), requireVerifiedInstructor, deleteInstructorCourse);

export default router;
