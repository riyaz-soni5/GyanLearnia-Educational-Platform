import Category from "../models/Category.model.js";
const toSlug = (s) => s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
export const listCategories = async (_req, res) => {
    const items = await Category.find({ isActive: true })
        .sort({ name: 1 })
        .lean();
    res.json({
        items: items.map((c) => ({ id: String(c._id), name: c.name, slug: c.slug })),
    });
};
// optional: allow adding new categories (admin only if you want)
export const createCategory = async (req, res) => {
    const name = String(req.body?.name || "").trim();
    if (name.length < 2)
        return res.status(400).json({ message: "Category name too short" });
    const slug = toSlug(name);
    const doc = await Category.create({ name, slug });
    res.status(201).json({ item: { id: String(doc._id), name: doc.name, slug: doc.slug } });
};
