import { Request, Response } from "express";
import Course from "../models/Course.model.js";

export async function listPublishedCourses(_req: Request, res: Response) {
  try {
    const items = await Course.find({ status: "Published" })
      .select("title subtitle thumbnailUrl category level language price currency createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      items: items.map((c: any) => ({
        id: String(c._id),
        title: c.title,
        subtitle: c.subtitle,
        thumbnailUrl: c.thumbnailUrl,
        category: c.category,
        level: c.level,
        language: c.language,
        price: c.price,
        currency: c.currency,
      })),
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to load courses" });
  }
}

export async function getPublishedCourse(req: Request, res: Response) {
  try {
    const id = req.params.id;

    const c = await Course.findOne({ _id: id, status: "Published" }).lean();
    if (!c) return res.status(404).json({ message: "Course not found" });

    return res.json({ item: c });
  } catch {
    return res.status(400).json({ message: "Invalid id" });
  }
}