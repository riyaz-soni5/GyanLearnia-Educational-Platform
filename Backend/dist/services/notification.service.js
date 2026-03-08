import mongoose from "mongoose";
import Notification from "../models/Notification.model.js";
const asTrimmed = (value) => String(value ?? "").trim();
export async function createNotification(input) {
    const userId = asTrimmed(input.userId);
    const actorId = asTrimmed(input.actorId ?? "");
    const title = asTrimmed(input.title);
    const message = asTrimmed(input.message);
    const link = asTrimmed(input.link ?? "");
    if (!userId || !mongoose.Types.ObjectId.isValid(userId))
        return null;
    if (!title || !message)
        return null;
    try {
        const payload = {
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
        if (link)
            payload.link = link;
        return await Notification.create(payload);
    }
    catch {
        return null;
    }
}
