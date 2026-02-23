import { Schema, model, Types } from "mongoose";

const CertificateSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    courseId: { type: Types.ObjectId, ref: "Course", required: true },
    issuedAt: { type: Date, default: Date.now },
    certNo: { type: String, required: true, unique: true },
    pdfUrl: { type: String, default: null }, // later if you generate PDFs
  },
  { timestamps: true }
);

CertificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default model("Certificate", CertificateSchema);