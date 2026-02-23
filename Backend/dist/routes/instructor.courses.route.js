import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { requireVerifiedInstructor } from "../middlewares/requireVerifiedInstructor.middleware.js";
import { createInstructorCourse, deleteInstructorCourse, getInstructorCourseById, listInstructorCourses, resubmitInstructorCourse, } from "../controllers/instructor.courses.controller.js";
const router = Router();
router.get("/mine", requireAuth, requireRole("instructor"), listInstructorCourses);
router.get("/:id", requireAuth, requireRole("instructor"), getInstructorCourseById);
// verified instructor can submit (Pending)
router.post("/", requireAuth, requireRole("instructor"), requireVerifiedInstructor, createInstructorCourse);
router.put("/:id/resubmit", requireAuth, requireRole("instructor"), requireVerifiedInstructor, resubmitInstructorCourse);
router.delete("/:id", requireAuth, requireRole("instructor"), requireVerifiedInstructor, deleteInstructorCourse);
export default router;
