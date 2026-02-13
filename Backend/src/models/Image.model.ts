import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true }, // "image/png", "image/jpeg"
    fileName: { type: String },
    size: { type: Number }, // bytes
  },
  { timestamps: true }
);

export default mongoose.model("Image", ImageSchema);