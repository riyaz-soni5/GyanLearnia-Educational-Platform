// Question.model.ts
import { Schema, model, Types } from "mongoose";

const QuestionVoteSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    value: { type: Number, enum: [1, -1], required: true },
  },
  { _id: false }
);

const QuestionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true, trim: true },

    categoryId: { type: Types.ObjectId, ref: "Category", required: true },
    level: { type: String, required: true },
    tags: [{ type: String }],
    authorId: { type: Types.ObjectId, ref: "User", required: true },

    views: { type: Number, default: 0 },
    viewedBy: [{ type: Types.ObjectId, ref: "User" }],
    viewedKeys: [{ type: String }],

    votes: { type: Number, default: 0 },                 // cached
    voters: { type: [QuestionVoteSchema], default: [] }, // ✅ NEW

    answersCount: { type: Number, default: 0 },
    hasVerifiedAnswer: { type: Boolean, default: false },
    acceptedAnswerId: { type: Types.ObjectId, ref: "Answer", default: null },

    isFastResponse: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// extra safety (same pattern as Answer)
QuestionSchema.index({ _id: 1, "voters.userId": 1 });

export default model("Question", QuestionSchema);