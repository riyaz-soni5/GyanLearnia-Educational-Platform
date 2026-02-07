// models/User.model.ts (updated)
import { Schema, model } from "mongoose";

export type UserRole = "student" | "instructor";

const UserSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "instructor"], required: true },

    // Instructor-only
    expertise: { type: String, trim: true },
    institution: { type: String, trim: true },

    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model("User", UserSchema);