import { Response, NextFunction } from "express";
import User from "../models/User.model.js";
import { AuthedRequest } from "./auth.middleware.js";

export async function requireVerifiedInstructor(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== "instructor") return res.status(403).json({ message: "Forbidden" });

    const user = await User.findById(req.user.id).select("isVerified verificationStatus role");
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const isVerified = Boolean(user.isVerified) || user.verificationStatus === "Verified";
    if (!isVerified) return res.status(403).json({ message: "Instructor not verified" });

    return next();
  } catch {
    return res.status(500).json({ message: "Auth check failed" });
  }
}
