import { Schema, model, Types } from "mongoose";

const PrivateChatMessageSchema = new Schema(
  {
    roomId: { type: Types.ObjectId, ref: "PrivateChatRoom", required: true, index: true },
    senderId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 20000 },
  },
  { timestamps: true }
);

PrivateChatMessageSchema.index({ roomId: 1, createdAt: -1 });

export default model("PrivateChatMessage", PrivateChatMessageSchema);
