import { Schema, model, Types } from "mongoose";
const CoursePurchaseSchema = new Schema({
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Types.ObjectId, ref: "Course", required: true, index: true },
    instructorId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    provider: { type: String, enum: ["khalti"], default: "khalti", required: true },
    pidx: { type: String, required: true, trim: true, unique: true },
    status: { type: String, enum: ["initiated", "completed", "failed"], default: "initiated", index: true },
    pricePaisa: { type: Number, required: true, min: 1 },
    paidAmountPaisa: { type: Number, default: 0, min: 0 },
    instructorSharePaisa: { type: Number, default: 0, min: 0 },
    platformFeePaisa: { type: Number, default: 0, min: 0 },
    paymentCompletedAt: { type: Date, default: null },
    instructorCreditTxId: { type: String, default: null },
    instructorCreditedAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });
CoursePurchaseSchema.index({ userId: 1, courseId: 1, status: 1 });
CoursePurchaseSchema.index({ courseId: 1, createdAt: -1 });
export default model("CoursePurchase", CoursePurchaseSchema);
