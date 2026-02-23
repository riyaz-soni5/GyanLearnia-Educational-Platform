// models/Answer.model.ts
import { Schema, model, Types } from "mongoose";
const AnswerVoteSchema = new Schema({
    userId: { type: Types.ObjectId, ref: "User", required: true },
    value: { type: Number, enum: [1, -1], required: true }, // 1 = upvote, -1 = downvote
}, { _id: false });
const AnswerSchema = new Schema({
    questionId: { type: Types.ObjectId, ref: "Question", required: true },
    authorId: { type: Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    votes: { type: Number, default: 0 }, // cached total
    voters: { type: [AnswerVoteSchema], default: [] }, // ✅ NEW
    isVerified: { type: Boolean, default: false },
}, { timestamps: true });
// one answer per user per question
AnswerSchema.index({ questionId: 1, authorId: 1 }, { unique: true });
// prevent duplicates in voters array per user (extra safety; logic also handles it)
AnswerSchema.index({ _id: 1, "voters.userId": 1 });
export default model("Answer", AnswerSchema);
