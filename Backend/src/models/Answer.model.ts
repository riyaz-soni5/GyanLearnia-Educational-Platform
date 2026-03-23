import { Schema, model, Types } from "mongoose";

const AnswerVoteSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    value: { type: Number, enum: [1, -1], required: true },
  },
  { _id: false }
);

const AnswerSchema = new Schema(
  {
    questionId: { type: Types.ObjectId, ref: "Question", required: true },
    authorId: { type: Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    votes: { type: Number, default: 0 },
    voters: { type: [AnswerVoteSchema], default: [] },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AnswerSchema.index({ questionId: 1, authorId: 1 }, { unique: true });
AnswerSchema.index({ _id: 1, "voters.userId": 1 });

export default model("Answer", AnswerSchema);
