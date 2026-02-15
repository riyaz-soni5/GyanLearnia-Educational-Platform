// models/Question.model.ts
import { Schema, model, Types } from "mongoose";

const QuestionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true, trim: true },

    categoryId: { type: Types.ObjectId, ref: "Category", required: true },
    level: { type: String, required: true },

    tags: [{ type: String }],
    authorId: { type: Types.ObjectId, ref: "User", required: true },

    views: { type: Number, default: 0 },
    votes: { type: Number, default: 0 },
    answersCount: { type: Number, default: 0 },

    // ✅ keep
    hasVerifiedAnswer: { type: Boolean, default: false },

    // ✅ add this
    acceptedAnswerId: { type: Types.ObjectId, ref: "Answer", default: null },

    isFastResponse: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model("Question", QuestionSchema);