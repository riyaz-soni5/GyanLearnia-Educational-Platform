import { Schema, model, Types } from "mongoose";
const ResourceSchema = new Schema({
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    sizeBytes: { type: Number, default: 0 },
}, { _id: false });
const LectureSchema = new Schema({
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["video", "file", "quiz", "note"], required: true },
    // video
    videoUrl: { type: String, default: null },
    durationSec: { type: Number, default: 0 },
    // note
    noteText: { type: String, default: "" },
    // quiz
    quizId: { type: Types.ObjectId, ref: "Quiz", default: null },
    // resources for the lecture
    resources: { type: [ResourceSchema], default: [] },
    isFreePreview: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
}, { _id: true });
const SectionSchema = new Schema({
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    lectures: { type: [LectureSchema], default: [] },
}, { _id: true });
const CertificateTemplateSchema = new Schema({
    imageUrl: { type: String, default: "" },
    nameXPercent: { type: Number, default: 50 },
    nameYPercent: { type: Number, default: 55 },
    nameFontSizePx: { type: Number, default: 42 },
    nameColor: { type: String, default: "#111827" },
}, { _id: false });
const CourseSchema = new Schema({
    instructorId: { type: Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    outcomes: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    category: { type: String, trim: true, default: "" },
    level: { type: String, trim: true, default: "Beginner" },
    language: { type: String, trim: true, default: "English" },
    thumbnailUrl: { type: String, default: null },
    price: { type: Number, default: 0 },
    currency: { type: String, default: "NPR" },
    status: { type: String, enum: ["Draft", "Pending", "Published", "Rejected"], default: "Draft" },
    rejectionReason: { type: String, default: null },
    sections: { type: [SectionSchema], default: [] },
    certificate: {
        enabled: { type: Boolean, default: false },
        template: { type: CertificateTemplateSchema, default: () => ({}) },
    },
    totalLectures: { type: Number, default: 0 },
    totalVideoSec: { type: Number, default: 0 },
}, { timestamps: true });
CourseSchema.index({ instructorId: 1, status: 1, createdAt: -1 });
export default model("Course", CourseSchema);
