import { Schema, model, Types } from "mongoose";
const PrivateChatRoomSchema = new Schema({
    pairKey: { type: String, required: true, unique: true, index: true },
    memberIds: {
        type: [{ type: Types.ObjectId, ref: "User", required: true }],
        required: true,
        validate: {
            validator: (value) => Array.isArray(value) && value.length === 2,
            message: "Private chat room must contain exactly two members",
        },
    },
    isActive: { type: Boolean, default: true, index: true },
    createdByConnectionId: { type: Types.ObjectId, ref: "MentorConnection", default: null },
    lastMessageAt: { type: Date, default: null },
}, { timestamps: true });
export default model("PrivateChatRoom", PrivateChatRoomSchema);
