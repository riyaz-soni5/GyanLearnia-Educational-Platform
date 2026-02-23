import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { approveCourse, listPendingCourses, rejectCourse } from "../controllers/admin.courses.controller.js";
const router = Router();
router.get("/pending", requireAuth, requireRole("admin"), listPendingCourses);
router.post("/:id/approve", requireAuth, requireRole("admin"), approveCourse);
router.post("/:id/reject", requireAuth, requireRole("admin"), rejectCourse);
export default router;
