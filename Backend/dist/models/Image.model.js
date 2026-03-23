import mongoose from "mongoose";
const ImageSchema = new mongoose.Schema({
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    fileName: { type: String },
    size: { type: Number },
}, { timestamps: true });
export default mongoose.model("Image", ImageSchema);
