import { Schema, model, Types } from "mongoose";
const CourseReviewSchema = new Schema({
    courseId: { type: Types.ObjectId, ref: "Course", required: true },
    userId: { type: Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1200 },
}, { timestamps: true });
CourseReviewSchema.index({ courseId: 1, createdAt: -1 });
CourseReviewSchema.index({ userId: 1, courseId: 1 }, { unique: true });
export default model("CourseReview", CourseReviewSchema);
