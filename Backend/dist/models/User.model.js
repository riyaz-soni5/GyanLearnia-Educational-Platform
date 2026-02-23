// models/User.model.ts
import { Schema, model } from "mongoose";
const UserSchema = new Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "instructor", "admin"], required: true },
    // Instructor-only
    expertise: { type: String, trim: true },
    institution: { type: String, trim: true },
    // ✅ verification flow
    verificationStatus: {
        type: String,
        enum: ["NotSubmitted", "Pending", "Rejected", "Verified"],
        default: "NotSubmitted",
    },
    verificationReason: { type: String, trim: true, default: null },
    isVerified: { type: Boolean, default: false },
    points: { type: Number, default: 0 },
    acceptedAnswers: { type: Number, default: 0 },
}, { timestamps: true });
export default model("User", UserSchema);
