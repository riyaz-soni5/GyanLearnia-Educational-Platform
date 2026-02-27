// models/User.model.ts
import { Schema, model } from "mongoose";
const UserSchema = new Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "instructor", "admin"], required: true },
    // Profile extras
    avatarUrl: { type: String, trim: true, default: null },
    dateOfBirth: { type: Date, default: null },
    gender: {
        type: String,
        enum: ["", "male", "female", "other", "prefer_not_to_say"],
        default: "",
    },
    bio: { type: String, trim: true, default: "" },
    interests: {
        type: [String],
        default: [],
    },
    academicBackgrounds: {
        type: [
            {
                institution: { type: String, trim: true, required: true },
                startDate: { type: Date, required: true },
                endDate: { type: Date, default: null },
                isCurrent: { type: Boolean, default: false },
            },
        ],
        default: [],
    },
    socialLinks: {
        linkedin: { type: String, trim: true, default: "" },
        twitter: { type: String, trim: true, default: "" },
        facebook: { type: String, trim: true, default: "" },
        instagram: { type: String, trim: true, default: "" },
        website: { type: String, trim: true, default: "" },
    },
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
