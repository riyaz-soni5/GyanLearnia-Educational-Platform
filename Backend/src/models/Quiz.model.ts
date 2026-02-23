import { Schema, model, Types } from "mongoose";

const OptionSchema = new Schema(
  { text: { type: String, required: true, trim: true }, isCorrect: { type: Boolean, default: false } },
  { _id: true }
);

const QuestionSchema = new Schema(
  {
    prompt: { type: String, required: true, trim: true },
    options: { type: [OptionSchema], default: [] },
    explanation: { type: String, default: "" },
  },
  { _id: true }
);

const QuizSchema = new Schema(
  {
    courseId: { type: Types.ObjectId, ref: "Course", required: true },
    instructorId: { type: Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true, trim: true },
    passPercent: { type: Number, default: 60 },

    questions: { type: [QuestionSchema], default: [] },
  },
  { timestamps: true }
);

QuizSchema.index({ courseId: 1, instructorId: 1 });

export default model("Quiz", QuizSchema);