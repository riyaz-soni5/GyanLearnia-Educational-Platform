import { Schema, model } from "mongoose";

const ContactSubmissionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default model("ContactSubmission", ContactSubmissionSchema);
