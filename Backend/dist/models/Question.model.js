// Question.model.ts
import { Schema, model, Types } from "mongoose";
const QuestionVoteSchema = new Schema({
    userId: { type: Types.ObjectId, ref: "User", required: true },
    value: { type: Number, enum: [1, -1], required: true },
}, { _id: false });
const QuestionSchema = new Schema({
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    categoryId: { type: Types.ObjectId, ref: "Category", required: true },
    level: { type: String, required: true },
    tags: [{ type: String }],
    authorId: { type: Types.ObjectId, ref: "User", required: true },
    views: { type: Number, default: 0 },
    viewedBy: [{ type: Types.ObjectId, ref: "User" }],
    viewedKeys: [{ type: String }],
    votes: { type: Number, default: 0 }, // cached
    voters: { type: [QuestionVoteSchema], default: [] }, // ✅ NEW
    answersCount: { type: Number, default: 0 },
    hasVerifiedAnswer: { type: Boolean, default: false },
    acceptedAnswerId: { type: Types.ObjectId, ref: "Answer", default: null },
    isFastResponse: { type: Boolean, default: false },
    fastResponsePricePaisa: { type: Number, default: 0, min: 0 },
    fastResponseEscrowStatus: {
        type: String,
        enum: ["none", "funded", "released", "refunded"],
        default: "none",
    },
    fastResponseEscrowSource: {
        type: String,
        enum: ["none", "wallet", "khalti", "pro"],
        default: "none",
    },
    fastResponseEscrowSourceRef: { type: String, trim: true, default: null },
    fastResponseWinnerAnswerId: { type: Types.ObjectId, ref: "Answer", default: null },
    fastResponsePayoutPaisa: { type: Number, default: 0, min: 0 },
    fastResponsePlatformFeePaisa: { type: Number, default: 0, min: 0 },
    fastResponseReleasedAt: { type: Date, default: null },
}, { timestamps: true });
// extra safety (same pattern as Answer)
QuestionSchema.index({ _id: 1, "voters.userId": 1 });
export default model("Question", QuestionSchema);
