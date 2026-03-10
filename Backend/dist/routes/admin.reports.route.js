import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { getAdminReportInsights } from "../controllers/admin.reports.controller.js";
const router = Router();
router.get("/reports/insights", requireAuth, requireRole("admin"), getAdminReportInsights);
export default router;
