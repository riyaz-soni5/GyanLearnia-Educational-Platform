import { Router } from "express";
import { listCategories, createCategory } from "../controllers/category.controller.js";
// import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", listCategories);

// If you want only admin to add:
// router.post("/", requireAuth, requireRole("admin"), createCategory);

// If you want anyone to add (not recommended):
// router.post("/", createCategory);

export default router;