import { Router } from "express";
import { approveInstructor, listInstructorVerifications, rejectInstructor, } from "../controllers/adminVerification.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/requireAdmin.middleware.js";
const router = Router();
router.get("/admin/instructor-verifications", requireAuth, requireAdmin, listInstructorVerifications);
router.post("/admin/instructor-verifications/:id/approve", requireAuth, requireAdmin, approveInstructor);
router.post("/admin/instructor-verifications/:id/reject", requireAuth, requireAdmin, rejectInstructor);
export default router;
