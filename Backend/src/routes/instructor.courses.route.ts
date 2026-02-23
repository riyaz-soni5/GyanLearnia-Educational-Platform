import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { requireVerifiedInstructor } from "../middlewares/requireVerifiedInstructor.middleware.js";
import { createInstructorCourse, listInstructorCourses } from "../controllers/instructor.courses.controller.js";

const router = Router();

router.get("/mine", requireAuth, requireRole("instructor"), listInstructorCourses);

// verified instructor can submit (Pending)
router.post("/", requireAuth, requireRole("instructor"), requireVerifiedInstructor, createInstructorCourse);

export default router;