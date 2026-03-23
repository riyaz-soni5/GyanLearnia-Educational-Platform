import { Router } from "express";
import { deleteUser, listUsers, updateUserRole } from "../controllers/admin.users.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/users", requireAuth, requireRole("admin"), listUsers);
router.patch("/users/:id/role", requireAuth, requireRole("admin"), updateUserRole);
router.delete("/users/:id", requireAuth, requireRole("admin"), deleteUser);

export default router;
