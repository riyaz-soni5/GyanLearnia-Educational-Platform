import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getCurrentUser, updateCurrentUser, changePassword } from "../controllers/user.profile.controller.js";
const router = Router();
router.get("/me", requireAuth, getCurrentUser);
router.patch("/me", requireAuth, updateCurrentUser);
router.post("/change-password", requireAuth, changePassword);
export default router;
