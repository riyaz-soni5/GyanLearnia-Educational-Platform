import mongoose from "mongoose";
import Notification, { type NotificationType } from "../models/Notification.model.js";

export type CreateNotificationInput = {
  userId: string;
  actorId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  metadata?: Record<string, unknown>;
};

const trimValue = (value: unknown) => String(value ?? "").trim();

export async function createNotification(input: CreateNotificationInput) {
  const userId = trimValue(input.userId);
  const actorId = trimValue(input.actorId);
  const title = trimValue(input.title);
  const message = trimValue(input.message);
  const link = trimValue(input.link);

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;
  if (!title || !message) return null;

  try {
    const data: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
      type: input.type,
      title,
      message,
      isRead: false,
      readAt: null,
      metadata: input.metadata ?? {},
    };

    if (actorId && mongoose.Types.ObjectId.isValid(actorId)) {
      data.actorId = new mongoose.Types.ObjectId(actorId);
    }
    if (link) data.link = link;

    return Notification.create(data);
  } catch {
    return null;
  }
}
