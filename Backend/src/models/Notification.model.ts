import { Schema, model, Types } from "mongoose";

export type NotificationType =
  | "question_answered"
  | "answer_replied"
  | "reply_replied"
  | "instructor_verified"
  | "instructor_rejected"
  | "mentor_request"
  | "mentor_connection_accepted"
  | "mentor_connection_rejected"
  | "mentor_message"
  | "system";

const NotificationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    actorId: { type: Types.ObjectId, ref: "User", default: null },
    type: {
      type: String,
      enum: [
        "question_answered",
        "answer_replied",
        "reply_replied",
        "instructor_verified",
        "instructor_rejected",
        "mentor_request",
        "mentor_connection_accepted",
        "mentor_connection_rejected",
        "mentor_message",
        "system",
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    link: { type: String, trim: true, default: null },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default model("Notification", NotificationSchema);
