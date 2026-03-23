import mongoose from "mongoose";
import Notification from "../models/Notification.model.js";
const trimValue = (value) => String(value ?? "").trim();
export async function createNotification(input) {
    const userId = trimValue(input.userId);
    const actorId = trimValue(input.actorId);
    const title = trimValue(input.title);
    const message = trimValue(input.message);
    const link = trimValue(input.link);
    if (!userId || !mongoose.Types.ObjectId.isValid(userId))
        return null;
    if (!title || !message)
        return null;
    try {
        const data = {
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
        if (link)
            data.link = link;
        return Notification.create(data);
    }
    catch {
        return null;
    }
}
