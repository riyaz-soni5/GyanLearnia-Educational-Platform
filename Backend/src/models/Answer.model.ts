// models/Answer.model.ts
import { Schema, model, Types } from "mongoose";

const AnswerSchema = new Schema(
  {
    questionId: { type: Types.ObjectId, ref: "Question", required: true },
    authorId: { type: Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },

    votes: { type: Number, default: 0 },       // cached
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model("Answer", AnswerSchema);