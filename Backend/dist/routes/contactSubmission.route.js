import { Router } from "express";
import { createContactSubmission, listContactSubmissions } from "../controllers/contactSubmission.controller.js";
import { optionalAuth, requireAuth, requireRole } from "../middlewares/auth.middleware.js";
const router = Router();
router.post("/contact-submissions", optionalAuth, createContactSubmission);
router.get("/admin/contact-submissions", requireAuth, requireRole("admin"), listContactSubmissions);
export default router;
