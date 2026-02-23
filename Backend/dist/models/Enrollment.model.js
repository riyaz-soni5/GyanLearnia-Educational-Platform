import { Schema, model, Types } from "mongoose";
const EnrollmentSchema = new Schema({
    userId: { type: Types.ObjectId, ref: "User", required: true },
    courseId: { type: Types.ObjectId, ref: "Course", required: true },
    // store completed lecture IDs (subdocument _id from course.sections.lectures)
    completedLectureIds: { type: [String], default: [] },
    // quiz attempts summary
    quizScores: {
        type: Map,
        of: Number, // quizId -> percent
        default: {},
    },
    completedAt: { type: Date, default: null },
}, { timestamps: true });
EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
export default model("Enrollment", EnrollmentSchema);
