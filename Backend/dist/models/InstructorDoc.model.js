import mongoose from "mongoose";
const InstructorDocSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    docType: {
        type: String,
        enum: ["idCard", "certificate", "experienceLetter", "other"],
        required: true,
    },
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true }, // "application/pdf", "image/png"
    fileName: { type: String },
    size: { type: Number },
    status: { type: String, enum: ["Pending", "Verified", "Rejected"], default: "Pending" },
}, { timestamps: true });
InstructorDocSchema.index({ userId: 1, docType: 1 });
export default mongoose.model("InstructorDoc", InstructorDocSchema);
