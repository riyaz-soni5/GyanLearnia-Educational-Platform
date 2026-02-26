import Question from "../models/Question.model.js";
export const listQuestions = async (req, res) => {
    const { q = "", query = "", categoryId = "All", level = "All", sort = "Newest", status = "All", page = "1", limit = "10", } = req.query;
    const searchText = String(q || query).trim();
    const filter = {};
    if (searchText) {
        const searchRegex = new RegExp(searchText, "i");
        // Search by title, description(excerpt), and tags.
        filter.$or = [
            { title: searchRegex },
            { excerpt: searchRegex },
            { tags: searchRegex },
        ];
    }
    if (categoryId !== "All")
        filter.categoryId = categoryId;
    if (level !== "All")
        filter.level = level;
    if (status === "Answered")
        filter.hasVerifiedAnswer = true;
    if (status === "Unanswered")
        filter.hasVerifiedAnswer = false;
    const sortKey = String(sort).trim().toLowerCase();
    if (sortKey === "answered")
        filter.hasVerifiedAnswer = true;
    if (sortKey === "unanswered")
        filter.hasVerifiedAnswer = false;
    if (sortKey === "fast response" || sortKey === "fast_response" || sortKey === "fastresponse") {
        filter.isFastResponse = true;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const sortObj = sortKey === "most viewed"
        ? { views: -1, createdAt: -1 }
        : sortKey === "most voted"
            ? { votes: -1, createdAt: -1 }
            : sortKey === "fast response" || sortKey === "fast_response" || sortKey === "fastresponse"
                ? { createdAt: -1 }
                : sortKey === "answered"
                    ? { createdAt: -1 }
                    : sortKey === "unanswered"
                        ? { createdAt: -1 }
                        : { createdAt: -1 };
    const [items, total] = (await Promise.all([
        Question.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit))
            .populate("categoryId", "name")
            .populate("authorId", "firstName lastName fullName name username role avatarUrl")
            .lean(),
        Question.countDocuments(filter),
    ]));
    const meId = req.user?.id ? String(req.user.id) : null;
    const mapped = items.map((q) => {
        const authorObj = q.authorId;
        const myVote = meId
            ? (q.voters?.find((v) => String(v.userId) === meId)?.value ?? null)
            : null;
        return {
            id: String(q._id),
            title: q.title,
            excerpt: q.excerpt,
            categoryId: q.categoryId?._id
                ? String(q.categoryId._id)
                : q.categoryId
                    ? String(q.categoryId)
                    : undefined,
            categoryName: q.categoryId?.name,
            level: q.level,
            tags: q.tags ?? [],
            votes: q.votes ?? 0,
            myVote,
            views: q.views ?? 0,
            answersCount: q.answersCount ?? 0,
            isFastResponse: q.isFastResponse ?? false,
            hasVerifiedAnswer: q.hasVerifiedAnswer ?? false,
            status: q.hasVerifiedAnswer ? "Answered" : "Unanswered",
            createdAt: q.createdAt
                ? new Date(q.createdAt).toISOString()
                : undefined,
            updatedAt: q.updatedAt
                ? new Date(q.updatedAt).toISOString()
                : undefined,
            author: authorObj?.firstName && authorObj?.lastName
                ? `${authorObj.firstName} ${authorObj.lastName}`
                : authorObj?.fullName ||
                    authorObj?.name ||
                    authorObj?.username ||
                    "Anonymous",
            authorType: authorObj?.role || "student",
            authorAvatarUrl: authorObj?.avatarUrl || null,
        };
    });
    res.json({ items: mapped, total, page: Number(page), limit: Number(limit) });
};
export const getQuestion = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const ipRaw = req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        "";
    const ip = String(ipRaw).split(",")[0].trim();
    const ua = String(req.headers["user-agent"] || "");
    const guestKey = `${ip}::${ua}`;
    let q = null;
    // ✅ Logged-in user logic
    if (userId) {
        q = await Question.findOneAndUpdate({
            _id: id,
            authorId: { $ne: userId }, // owner view should NOT count
            viewedBy: { $ne: userId }, // already viewed should NOT count
        }, {
            $inc: { views: 1 },
            $addToSet: { viewedBy: userId },
        }, { new: true })
            .populate("categoryId", "name")
            .populate("authorId", "firstName lastName fullName name username role avatarUrl")
            .lean();
    }
    // ✅ Guest logic
    else {
        q = await Question.findOneAndUpdate({
            _id: id,
            viewedKeys: { $ne: guestKey },
        }, {
            $inc: { views: 1 },
            $addToSet: { viewedKeys: guestKey },
        }, { new: true })
            .populate("categoryId", "name")
            .populate("authorId", "firstName lastName fullName name username role avatarUrl")
            .lean();
    }
    // If not incremented, just fetch normally
    if (!q) {
        q = await Question.findById(id)
            .populate("categoryId", "name")
            .populate("authorId", "firstName lastName fullName name username role avatarUrl")
            .lean();
    }
    if (!q)
        return res.status(404).json({ message: "Question not found" });
    const meId = req.user?.id ? String(req.user.id) : null;
    const myVote = meId
        ? (q.voters?.find((v) => String(v.userId) === meId)?.value ?? null)
        : null;
    const authorObj = q.authorId;
    const authorName = authorObj?.firstName && authorObj?.lastName
        ? `${authorObj.firstName} ${authorObj.lastName}`
        : authorObj?.fullName ||
            authorObj?.name ||
            authorObj?.username ||
            "Anonymous";
    const authorType = authorObj?.role || "student";
    return res.json({
        item: {
            id: String(q._id),
            title: q.title,
            excerpt: q.excerpt,
            categoryId: q.categoryId?._id
                ? String(q.categoryId._id)
                : String(q.categoryId),
            categoryName: q.categoryId?.name,
            level: q.level,
            tags: q.tags ?? [],
            votes: q.votes ?? 0,
            myVote,
            views: q.views ?? 0,
            answersCount: q.answersCount ?? 0,
            isFastResponse: q.isFastResponse ?? false,
            hasVerifiedAnswer: q.hasVerifiedAnswer ?? false,
            acceptedAnswerId: q.acceptedAnswerId ?? null,
            status: q.hasVerifiedAnswer ? "Answered" : "Unanswered",
            createdAt: q.createdAt ? new Date(q.createdAt).toISOString() : undefined,
            updatedAt: q.updatedAt ? new Date(q.updatedAt).toISOString() : undefined,
            author: authorName,
            authorType,
            authorAvatarUrl: authorObj?.avatarUrl || null,
            authorId: authorObj?._id
                ? String(authorObj._id)
                : String(q.authorId),
        },
    });
};
export const createQuestion = async (req, res) => {
    const { title, excerpt, categoryId, level, tags = [], isFastResponse = false } = req.body || {};
    if (!title || title.trim().length < 10) {
        return res.status(400).json({ message: "Title must be at least 10 characters." });
    }
    if (!excerpt || excerpt.trim().length < 20) {
        return res.status(400).json({ message: "Question details must be at least 20 characters." });
    }
    if (!categoryId)
        return res.status(400).json({ message: "Category is required." });
    if (!level)
        return res.status(400).json({ message: "Level is required." });
    const userId = req.user?.id; // from requireAuth middleware
    const doc = await Question.create({
        title: title.trim(),
        excerpt: excerpt.trim(),
        categoryId,
        level,
        tags: Array.isArray(tags) ? tags.slice(0, 8) : [],
        isFastResponse: Boolean(isFastResponse),
        authorId: userId,
    });
    return res.status(201).json({
        message: "Question created",
        item: {
            id: String(doc._id),
            authorId: String(doc.authorId),
            title: doc.title,
            excerpt: doc.excerpt,
            categoryId: String(doc.categoryId),
            level: doc.level,
            tags: doc.tags,
            isFastResponse: doc.isFastResponse,
            createdAt: doc.createdAt,
        },
    });
};
export const updateQuestion = async (req, res) => {
    const { id } = req.params;
    const { title, excerpt } = req.body || {};
    if (title && String(title).trim().length < 10) {
        return res.status(400).json({ message: "Title must be at least 10 characters." });
    }
    if (excerpt && String(excerpt).trim().length < 20) {
        return res.status(400).json({ message: "Question details must be at least 20 characters." });
    }
    const q = await Question.findById(id);
    if (!q)
        return res.status(404).json({ message: "Question not found" });
    // ✅ only owner can edit
    if (String(q.authorId) !== String(req.user?.id)) {
        return res.status(403).json({ message: "Not allowed" });
    }
    if (title !== undefined)
        q.title = String(title).trim();
    if (excerpt !== undefined)
        q.excerpt = String(excerpt).trim();
    await q.save();
    return res.json({
        message: "Question updated",
        item: {
            id: String(q._id),
            title: q.title,
            excerpt: q.excerpt,
            categoryId: String(q.categoryId),
            level: q.level,
            tags: q.tags ?? [],
            isFastResponse: q.isFastResponse ?? false,
            votes: q.votes ?? 0,
            views: q.views ?? 0,
            answersCount: q.answersCount ?? 0,
            hasVerifiedAnswer: q.hasVerifiedAnswer ?? false,
            status: q.hasVerifiedAnswer ? "Answered" : "Unanswered",
            createdAt: q.createdAt ? new Date(q.createdAt).toISOString() : undefined,
            updatedAt: q.updatedAt ? new Date(q.updatedAt).toISOString() : undefined,
            authorId: String(q.authorId),
        },
    });
};
export const deleteQuestion = async (req, res) => {
    const { id } = req.params;
    const q = await Question.findById(id);
    if (!q)
        return res.status(404).json({ message: "Question not found" });
    if (String(q.authorId) !== String(req.user?.id)) {
        return res.status(403).json({ message: "Not allowed" });
    }
    await Question.findByIdAndDelete(id);
    return res.json({ message: "Question deleted" });
};
const applyVote = (existing, next) => {
    if (existing === next)
        return { newValue: null, delta: -next };
    if (existing === null)
        return { newValue: next, delta: next };
    return { newValue: next, delta: next - existing };
};
// POST /api/questions/:id/upvote
export const upvoteQuestion = async (req, res) => {
    try {
        const { id: questionId } = req.params;
        if (!req.user?.id)
            return res.status(401).json({ message: "Unauthorized" });
        const q = await Question.findById(questionId);
        if (!q)
            return res.status(404).json({ message: "Question not found" });
        const userId = String(req.user.id);
        const idx = q.voters.findIndex((v) => String(v.userId) === userId);
        const existing = idx >= 0 ? Number(q.voters[idx].value) : null;
        const { newValue, delta } = applyVote(existing, 1);
        if (newValue === null) {
            q.voters = q.voters.filter((v) => String(v.userId) !== userId);
        }
        else if (idx >= 0) {
            q.voters[idx].value = newValue;
        }
        else {
            q.voters.push({ userId: req.user.id, value: newValue });
        }
        q.votes = Number(q.votes || 0) + delta;
        await q.save();
        return res.json({ message: "Voted", votes: q.votes, myVote: newValue });
    }
    catch {
        return res.status(500).json({ message: "Failed to upvote question" });
    }
};
// POST /api/questions/:id/downvote
export const downvoteQuestion = async (req, res) => {
    try {
        const { id: questionId } = req.params;
        if (!req.user?.id)
            return res.status(401).json({ message: "Unauthorized" });
        const q = await Question.findById(questionId);
        if (!q)
            return res.status(404).json({ message: "Question not found" });
        const userId = String(req.user.id);
        const idx = q.voters.findIndex((v) => String(v.userId) === userId);
        const existing = idx >= 0 ? Number(q.voters[idx].value) : null;
        const { newValue, delta } = applyVote(existing, -1);
        if (newValue === null) {
            q.voters = q.voters.filter((v) => String(v.userId) !== userId);
        }
        else if (idx >= 0) {
            q.voters[idx].value = newValue;
        }
        else {
            q.voters.push({ userId: req.user.id, value: newValue });
        }
        q.votes = Number(q.votes || 0) + delta;
        await q.save();
        return res.json({ message: "Voted", votes: q.votes, myVote: newValue });
    }
    catch {
        return res.status(500).json({ message: "Failed to downvote question" });
    }
};
