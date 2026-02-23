import { Schema, model } from "mongoose";
const CategorySchema = new Schema({
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
export default model("Category", CategorySchema);
