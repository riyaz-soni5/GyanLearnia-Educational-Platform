import Reply from "../models/Reply.model.js";
import Answer from "../models/Answer.model.js";
// helper: apply vote switch / toggle (same as your Answer logic)
const applyVote = (existing, next) => {
    if (existing === next)
        return { newValue: null, delta: -next };
    if (existing === null)
        return { newValue: next, delta: next };
    return { newValue: next, delta: next - existing };
};
// GET /api/questions/:id/answers/:answerId/replies?parentId=&limit=5&cursor=ISO_DATE
export const listReplies = async (req, res) => {
    try {
        const { id: questionId, answerId } = req.params;
        // parentId can be "null", "" or missing => root replies
        const parentIdRaw = req.query.parentId ?? "";
        const parentReplyId = parentIdRaw && parentIdRaw !== "null" ? parentIdRaw : null;
        const limit = Math.min(Math.max(Number(req.query.limit || 5), 1), 20);
        const cursor = String(req.query.cursor || "").trim();
        const cursorDate = cursor ? new Date(cursor) : null;
        // verify answer exists (prevents leaking)
        const ans = await Answer.findOne({ _id: answerId, questionId }).lean();
        if (!ans)
            return res.status(404).json({ message: "Answer not found" });
        const filter = { questionId, answerId, parentReplyId };
        if (cursorDate && !Number.isNaN(cursorDate.getTime())) {
            filter.createdAt = { $lt: cursorDate };
        }
        // fetch limit+1 to detect hasMore
        const rows = await Reply.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit + 1)
            .populate("authorId", "firstName lastName role email")
            .lean();
        const hasMore = rows.length > limit;
        const slice = hasMore ? rows.slice(0, limit) : rows;
        const nextCursor = hasMore && slice.length
            ? new Date(slice[slice.length - 1].createdAt).toISOString()
            : null;
        const meId = req.user?.id ? String(req.user.id) : null;
        const items = slice.map((r) => {
            const myVote = meId
                ? (r.voters?.find((v) => String(v.userId) === meId)?.value ?? null)
                : null;
            const authorObj = r.authorId;
            const author = authorObj
                ? `${authorObj.firstName ?? ""} ${authorObj.lastName ?? ""}`.trim() ||
                    authorObj.email
                : "Unknown";
            return {
                id: String(r._id),
                questionId: String(r.questionId),
                answerId: String(r.answerId),
                parentReplyId: r.parentReplyId ? String(r.parentReplyId) : null,
                content: r.content,
                votes: r.votes ?? 0,
                myVote,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
                authorId: authorObj?._id ? String(authorObj._id) : undefined,
                author,
                authorType: authorObj?.role ?? "student",
            };
        });
        return res.json({ items, hasMore, nextCursor });
    }
    catch {
        return res.status(500).json({ message: "Failed to load replies" });
    }
};
// POST /api/questions/:id/answers/:answerId/replies (requireAuth)
export const postReply = async (req, res) => {
    try {
        const { id: questionId, answerId } = req.params;
        const { content, parentReplyId = null } = req.body || {};
        if (!req.user?.id)
            return res.status(401).json({ message: "Unauthorized" });
        const html = String(content || "").trim();
        if (!html || html.length < 3) {
            return res.status(400).json({ message: "Reply is too short" });
        }
        const ans = await Answer.findOne({ _id: answerId, questionId }).lean();
        if (!ans)
            return res.status(404).json({ message: "Answer not found" });
        // if replying to a reply, ensure it belongs to same answer/question
        if (parentReplyId) {
            const parent = await Reply.findOne({ _id: parentReplyId, questionId, answerId }).lean();
            if (!parent)
                return res.status(404).json({ message: "Parent reply not found" });
        }
        const created = await Reply.create({
            questionId,
            answerId,
            parentReplyId: parentReplyId || null,
            authorId: req.user.id,
            content: html,
        });
        return res.status(201).json({
            message: "Reply posted",
            item: {
                id: String(created._id),
                questionId: String(created.questionId),
                answerId: String(created.answerId),
                parentReplyId: created.parentReplyId ? String(created.parentReplyId) : null,
                content: created.content,
                votes: created.votes ?? 0,
                myVote: null,
                createdAt: created.createdAt,
                authorId: String(req.user.id),
                author: "You",
                authorType: req.user.role ?? "student",
            },
        });
    }
    catch {
        return res.status(500).json({ message: "Failed to post reply" });
    }
};
// PATCH /api/questions/:id/answers/:answerId/replies/:replyId (requireAuth)
export const updateReply = async (req, res) => {
    try {
        const { id: questionId, answerId, replyId } = req.params;
        const { content } = req.body || {};
        if (!req.user?.id)
            return res.status(401).json({ message: "Unauthorized" });
        const html = String(content || "").trim();
        if (!html || html.length < 3) {
            return res.status(400).json({ message: "Reply is too short" });
        }
        const r = await Reply.findOne({ _id: replyId, questionId, answerId });
        if (!r)
            return res.status(404).json({ message: "Reply not found" });
        const isOwner = String(r.authorId) === String(req.user.id);
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin)
            return res.status(403).json({ message: "Not allowed" });
        r.content = html;
        await r.save();
        return res.json({
            message: "Reply updated",
            item: {
                id: String(r._id),
                content: r.content,
                updatedAt: r.updatedAt,
            },
        });
    }
    catch {
        return res.status(500).json({ message: "Failed to update reply" });
    }
};
// DELETE /api/questions/:id/answers/:answerId/replies/:replyId (requireAuth)
export const deleteReply = async (req, res) => {
    try {
        const { id: questionId, answerId, replyId } = req.params;
        if (!req.user?.id)
            return res.status(401).json({ message: "Unauthorized" });
        const r = await Reply.findOne({ _id: replyId, questionId, answerId });
        if (!r)
            return res.status(404).json({ message: "Reply not found" });
        const isOwner = String(r.authorId) === String(req.user.id);
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin)
            return res.status(403).json({ message: "Not allowed" });
        // delete this reply + its children (simple cascade)
        await Reply.deleteMany({
            questionId,
            answerId,
            $or: [{ _id: replyId }, { parentReplyId: replyId }],
        });
        return res.json({ message: "Reply deleted" });
    }
    catch {
        return res.status(500).json({ message: "Failed to delete reply" });
    }
};
// POST /api/questions/:id/answers/:answerId/replies/:replyId/upvote
export const upvoteReply = async (req, res) => {
    try {
        const { id: questionId, answerId, replyId } = req.params;
        if (!req.user?.id)
            return res.status(401).json({ message: "Unauthorized" });
        const r = await Reply.findOne({ _id: replyId, questionId, answerId });
        if (!r)
            return res.status(404).json({ message: "Reply not found" });
        const userId = String(req.user.id);
        const idx = r.voters.findIndex((v) => String(v.userId) === userId);
        const existing = idx >= 0 ? Number(r.voters[idx].value) : null;
        const { newValue, delta } = applyVote(existing, 1);
        if (newValue === null) {
            r.voters = r.voters.filter((v) => String(v.userId) !== userId);
        }
        else if (idx >= 0) {
            r.voters[idx].value = newValue;
        }
        else {
            r.voters.push({ userId: req.user.id, value: newValue });
        }
        r.votes = Number(r.votes || 0) + delta;
        await r.save();
        return res.json({ message: "Voted", votes: r.votes, myVote: newValue });
    }
    catch {
        return res.status(500).json({ message: "Failed to upvote reply" });
    }
};
// POST /api/questions/:id/answers/:answerId/replies/:replyId/downvote
export const downvoteReply = async (req, res) => {
    try {
        const { id: questionId, answerId, replyId } = req.params;
        if (!req.user?.id)
            return res.status(401).json({ message: "Unauthorized" });
        const r = await Reply.findOne({ _id: replyId, questionId, answerId });
        if (!r)
            return res.status(404).json({ message: "Reply not found" });
        const userId = String(req.user.id);
        const idx = r.voters.findIndex((v) => String(v.userId) === userId);
        const existing = idx >= 0 ? Number(r.voters[idx].value) : null;
        const { newValue, delta } = applyVote(existing, -1);
        if (newValue === null) {
            r.voters = r.voters.filter((v) => String(v.userId) !== userId);
        }
        else if (idx >= 0) {
            r.voters[idx].value = newValue;
        }
        else {
            r.voters.push({ userId: req.user.id, value: newValue });
        }
        r.votes = Number(r.votes || 0) + delta;
        await r.save();
        return res.json({ message: "Voted", votes: r.votes, myVote: newValue });
    }
    catch {
        return res.status(500).json({ message: "Failed to downvote reply" });
    }
};
