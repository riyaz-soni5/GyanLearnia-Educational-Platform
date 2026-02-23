import { Router } from "express";
import { getPublishedCourse, listPublishedCourses } from "../controllers/courses.controller.js";

const router = Router();

router.get("/", listPublishedCourses);
router.get("/:id", getPublishedCourse);

export default router;