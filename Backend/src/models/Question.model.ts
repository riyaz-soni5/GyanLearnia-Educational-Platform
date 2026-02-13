// models/Question.model.ts
import { Schema, model, Types } from "mongoose";

const QuestionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true, trim: true },

    categoryId: { type: Types.ObjectId, ref: "Category", required: true }, // ✅ DB category
    level: { type: String, required: true }, // School / +2 / Bachelor / Master / PhD / Others

    tags: [{ type: String }],
    authorId: { type: Types.ObjectId, ref: "User", required: true },

    views: { type: Number, default: 0 },
    votes: { type: Number, default: 0 },
    answersCount: { type: Number, default: 0 },
    hasVerifiedAnswer: { type: Boolean, default: false },
    isFastResponse: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model("Question", QuestionSchema);