// middlewares/requireAdmin.middleware.ts
import { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const u = (req as any).user;
  if (!u) return res.status(401).json({ message: "Unauthorized" });
  if (u.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  next();
}