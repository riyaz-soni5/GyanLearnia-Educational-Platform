import { Schema, model, Types } from "mongoose";

export type CourseStatus = "Draft" | "Pending" | "Published" | "Rejected";
export type LectureType = "video" | "file" | "quiz" | "note";

const ResourceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    sizeBytes: { type: Number, default: 0 },
  },
  { _id: false }
);

const LectureSchema = new Schema(
  {
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
  },
  { _id: true }
);

const SectionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    lectures: { type: [LectureSchema], default: [] },
  },
  { _id: true }
);

const CourseSchema = new Schema(
  {
    instructorId: { type: Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    outcomes: { type: [String], default: [] },
    requirements: { type: [String], default: [] },

    category: { type: String, trim: true, default: "" },
    level: { type: String, trim: true, default: "Beginner" },
    language: { type: String, trim: true, default: "English" },

    thumbnailUrl: { type: String, default: null },

    price: { type: Number, default: 0 },
    currency: { type: String, default: "NPR" },

    status: { type: String, enum: ["Draft", "Pending", "Published", "Rejected"], default: "Draft" },
    rejectionReason: { type: String, default: null },

    sections: { type: [SectionSchema], default: [] },

    totalLectures: { type: Number, default: 0 },
    totalVideoSec: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CourseSchema.index({ instructorId: 1, status: 1, createdAt: -1 });

export default model("Course", CourseSchema);
