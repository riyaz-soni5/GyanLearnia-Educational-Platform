import ContactSubmission from "../models/ContactSubmission.model.js";
export async function createContactSubmission(req, res) {
    try {
        const { firstName = "", lastName = "", email = "", phone = "", message = "", } = req.body;
        const data = {
            userId: req.user?.id || null,
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            email: String(email).trim().toLowerCase(),
            phone: String(phone).trim(),
            message: String(message).trim(),
        };
        if (!data.firstName || !data.lastName || !data.email || !data.phone || !data.message) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (data.message.length < 10) {
            return res.status(400).json({ message: "Message must be at least 10 characters long" });
        }
        const created = await ContactSubmission.create(data);
        return res.status(201).json({
            message: "Contact form submitted successfully",
            item: {
                id: String(created._id),
                firstName: created.firstName,
                lastName: created.lastName,
                email: created.email,
                phone: created.phone,
                message: created.message,
                createdAt: created.createdAt,
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Failed to submit contact form",
        });
    }
}
export async function listContactSubmissions(_req, res) {
    try {
        const items = await ContactSubmission.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        return res.json({
            items: items.map((item) => ({
                id: String(item._id),
                userId: item.userId ? String(item.userId) : null,
                firstName: String(item.firstName || ""),
                lastName: String(item.lastName || ""),
                email: String(item.email || ""),
                phone: String(item.phone || ""),
                message: String(item.message || ""),
                createdAt: item.createdAt,
            })),
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Failed to load contact submissions",
        });
    }
}
