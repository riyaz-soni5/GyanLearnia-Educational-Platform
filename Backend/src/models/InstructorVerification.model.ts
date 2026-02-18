// models/InstructorVerification.model.ts
import { Schema, model, Types } from "mongoose";

export type VerificationStatus = "pending" | "approved" | "rejected";

const DocSchema = new Schema(
  {
    kind: {
      type: String,
      enum: ["idCard", "certificate", "experienceLetter", "other"],
      required: true,
    },
    url: { type: String, required: true }, // local path like "/uploads/verification/xxx.pdf"
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const InstructorVerificationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, unique: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    docs: { type: [DocSchema], default: [] },

    notes: { type: String, trim: true }, // admin note / reject reason
    reviewedBy: { type: Types.ObjectId, ref: "User" }, // admin id (optional)
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export default model("InstructorVerification", InstructorVerificationSchema);