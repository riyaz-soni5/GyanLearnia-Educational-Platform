import { Schema, model } from "mongoose";

export type UserRole = "student" | "instructor";

const UserSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "instructor"], required: true },

    // Instructor-only
    expertise: { type: String },
    institution: { type: String },

    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model("User", UserSchema);