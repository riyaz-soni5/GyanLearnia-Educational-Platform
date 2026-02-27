import { Schema, model, Types } from "mongoose";
const MentorDiscoveryActionSchema = new Schema({
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    mentorId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    action: {
        type: String,
        enum: ["Skipped", "Blocked"],
        required: true,
        index: true,
    },
}, { timestamps: true });
MentorDiscoveryActionSchema.index({ userId: 1, mentorId: 1, action: 1 }, { unique: true });
export default model("MentorDiscoveryAction", MentorDiscoveryActionSchema);
