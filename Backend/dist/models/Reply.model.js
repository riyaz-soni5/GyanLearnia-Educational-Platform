// models/Reply.model.ts
import { Schema, model, Types } from "mongoose";
const ReplyVoteSchema = new Schema({
    userId: { type: Types.ObjectId, ref: "User", required: true },
    value: { type: Number, enum: [1, -1], required: true }, // 1=upvote, -1=downvote
}, { _id: false });
const ReplySchema = new Schema({
    questionId: { type: Types.ObjectId, ref: "Question", required: true },
    answerId: { type: Types.ObjectId, ref: "Answer", required: true },
    // For threads: reply-to-reply
    parentReplyId: { type: Types.ObjectId, ref: "Reply", default: null },
    authorId: { type: Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    votes: { type: Number, default: 0 },
    voters: { type: [ReplyVoteSchema], default: [] },
}, { timestamps: true });
// common query indexes
ReplySchema.index({ answerId: 1, parentReplyId: 1, createdAt: -1 });
ReplySchema.index({ _id: 1, "voters.userId": 1 });
export default model("Reply", ReplySchema);
