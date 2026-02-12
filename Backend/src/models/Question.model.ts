// models/Question.model.ts
import { Schema, model, Types } from "mongoose";

const QuestionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    subject: { type: String, required: true },
    level: { type: String, required: true },
    tags: [{ type: String }],
    authorId: { type: Types.ObjectId, ref: "User", required: true },

    views: { type: Number, default: 0 },
    votes: { type: Number, default: 0 },          // cached
    answersCount: { type: Number, default: 0 },   // cached
    hasVerifiedAnswer: { type: Boolean, default: false },
    isFastResponse: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model("Question", QuestionSchema);