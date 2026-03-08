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

const asTrimmed = (value: unknown) => String(value ?? "").trim();

export async function createNotification(input: CreateNotificationInput) {
  const userId = asTrimmed(input.userId);
  const actorId = asTrimmed(input.actorId ?? "");
  const title = asTrimmed(input.title);
  const message = asTrimmed(input.message);
  const link = asTrimmed(input.link ?? "");

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;
  if (!title || !message) return null;

  try {
    const payload: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
      type: input.type,
      title,
      message,
      isRead: false,
      readAt: null,
      metadata: input.metadata ?? {},
    };

    if (actorId && mongoose.Types.ObjectId.isValid(actorId)) {
      payload.actorId = new mongoose.Types.ObjectId(actorId);
    }
    if (link) payload.link = link;

    return await Notification.create(payload);
  } catch {
    return null;
  }
}
