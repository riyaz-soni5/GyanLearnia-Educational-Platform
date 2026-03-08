import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { listMyNotifications, markAllNotificationsRead, markNotificationRead, } from "../controllers/notification.controller.js";
const router = Router();
router.get("/", requireAuth, listMyNotifications);
router.patch("/:id/read", requireAuth, markNotificationRead);
router.post("/read-all", requireAuth, markAllNotificationsRead);
export default router;
