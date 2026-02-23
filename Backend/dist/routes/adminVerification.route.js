// routes/adminVerification.route.ts
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/requireAdmin.middleware.js";
import { listInstructorVerifications, approveInstructor, rejectInstructor, } from "../controllers/adminVerification.controller.js";
const router = Router();
// GET list
router.get("/admin/instructor-verifications", requireAuth, requireAdmin, listInstructorVerifications);
// POST approve/reject
router.post("/admin/instructor-verifications/:id/approve", requireAuth, requireAdmin, approveInstructor);
router.post("/admin/instructor-verifications/:id/reject", requireAuth, requireAdmin, rejectInstructor);
export default router;
