import type { Response } from "express";
import mongoose from "mongoose";
import Notification from "../models/Notification.model.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";

export async function listMyNotifications(req: AuthedRequest, res: Response) {
  try {
    const userId = String(req.user?.id || "").trim();
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 50);

    const [items, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return res.json({
      unreadCount,
      items: items.map((item: any) => ({
        id: String(item._id),
        type: String(item.type || "system"),
        title: String(item.title || ""),
        message: String(item.message || ""),
        link: item.link ? String(item.link) : null,
        isRead: Boolean(item.isRead),
        createdAt: item.createdAt,
        readAt: item.readAt ?? null,
      })),
    });
  } catch {
    return res.status(500).json({ message: "Failed to load notifications" });
  }
}

export async function markNotificationRead(req: AuthedRequest, res: Response) {
  try {
    const userId = String(req.user?.id || "").trim();
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "Notification id is required" });
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    await Notification.findOneAndUpdate(
      { _id: id, userId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    return res.json({ message: "Notification marked as read", unreadCount });
  } catch {
    return res.status(500).json({ message: "Failed to mark notification as read" });
  }
}

export async function markAllNotificationsRead(req: AuthedRequest, res: Response) {
  try {
    const userId = String(req.user?.id || "").trim();
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return res.json({ message: "All notifications marked as read", unreadCount: 0 });
  } catch {
    return res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
}
