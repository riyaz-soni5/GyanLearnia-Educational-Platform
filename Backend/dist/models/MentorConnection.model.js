import { Schema, model, Types } from "mongoose";
const MentorConnectionSchema = new Schema({
    senderId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    receiverId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    pairKey: { type: String, required: true, unique: true, index: true },
    status: {
        type: String,
        enum: ["Pending", "Accepted", "Rejected", "Cancelled"],
        default: "Pending",
        index: true,
    },
    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    respondedById: { type: Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });
MentorConnectionSchema.index({ senderId: 1, status: 1 });
MentorConnectionSchema.index({ receiverId: 1, status: 1 });
export default model("MentorConnection", MentorConnectionSchema);
