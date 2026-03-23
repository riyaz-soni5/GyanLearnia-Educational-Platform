import Answer from "../models/Answer.model.js";
import Question from "../models/Question.model.js";
import User from "../models/User.model.js";
import { createNotification } from "../services/notification.service.js";
import { creditUserWallet } from "../services/wallet.service.js";
const ACCEPT_POINTS = 15;
const FAST_RESPONSE_PLATFORM_FEE_PERCENT = 30;
const toPlainText = (html) => String(html ?? "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
export const listAnswers = async (req, res) => {
    try {
        const { id: questionId } = req.params;
        const answers = await Answer.find({ questionId })
            .sort({ isVerified: -1, votes: -1, createdAt: -1 })
            .populate("authorId", "firstName lastName role email avatarUrl")
            .lean();
        const meId = req.user?.id ? String(req.user.id) : null;
        const items = answers.map((a) => {
            const myVote = meId
                ? (a.voters?.find((v) => String(v.userId) === meId)?.value ?? null)
                : null;
            return {
                id: String(a._id),
                questionId: String(a.questionId),
                content: a.content,
                votes: a.votes,
                myVote,
                isVerified: a.isVerified,
                createdAt: a.createdAt,
                authorId: a.authorId?._id ? String(a.authorId._id) : undefined,
                author: a.authorId
                    ? `${a.authorId.firstName ?? ""} ${a.authorId.lastName ?? ""}`.trim() || a.authorId.email
                    : "Unknown",
                authorType: a.authorId?.role ?? "student",
                authorAvatarUrl: a.authorId?.avatarUrl ?? null,
            };
        });
        return res.json({ items });
    }
    catch {
        return res.status(500).json({ message: "Failed to load answers" });
    }
};
export const postAnswer = async (req, res) => {
    try {
        const { id: questionId } = req.params;
        const { content } = req.body;
        if (!req.user?.id)
            return res.status(401).json({ message: "Unauthorized" });
        if (!content || String(content).trim().length < 10) {
            return res.status(400).json({ message: "Answer must be at least 10 characters" });
        }
        const q = await Question.findById(questionId);
        if (!q)
            return res.status(404).json({ message: "Question not found" });
        if (String(q.authorId) === String(req.user.id)) {
            return res.status(403).json({ message: "You cannot answer your own question" });
        }
        const existing = await Answer.findOne({ questionId, authorId: req.user.id });
        if (existing) {
            return res.status(409).json({ message: "You already answered. Delete your answer to answer again." });
        }
        const answer = await Answer.create({
            questionId,
            authorId: req.user.id,
            content: String(content).trim(),
        });
        const authorDoc = await User.findById(req.user.id)
            .select("firstName lastName role email avatarUrl")
            .lean();
        await Question.findByIdAndUpdate(questionId, { $inc: { answersCount: 1 } });
        const questionOwnerId = String(q?.authorId ?? "");
        const actorId = String(req.user.id);
        if (questionOwnerId && questionOwnerId !== actorId) {
            const preview = toPlainText(String(content || "")).slice(0, 140);
            await createNotification({
                userId: questionOwnerId,
                actorId,
                type: "question_answered",
                title: "New answer on your question",
                message: preview || "Someone answered your question.",
                link: `/questions/${questionId}`,
                metadata: { questionId, answerId: String(answer._id) },
            });
        }
        return res.status(201).json({
            message: "Answer posted",
            answer: {
                id: answer._id,
                questionId: answer.questionId,
                content: answer.content,
                votes: answer.votes,
                isVerified: answer.isVerified,
                createdAt: answer.createdAt,
                authorAvatarUrl: authorDoc?.avatarUrl ?? null,
            },
            authorId: String(req.user.id),
            author: [authorDoc?.firstName, authorDoc?.lastName].filter(Boolean).join(" ").trim() ||
                authorDoc?.email ||
                "You",
            authorType: authorDoc?.role ?? req.user.role ?? "student",
        });
    }
    catch (err) {
        if (err?.code === 11000) {
            return res.status(409).json({ message: "You already answered. Delete your answer to answer again." });
        }
        return res.status(500).json({ message: "Failed to post answer" });
    }
};
export const acceptAnswer = async (req, res) => {
    try {
        const { id: questionId, answerId } = req.params;
        if (!req.user?.id)
            return res.status(401).json({ message: "Unauthorized" });
        const q = await Question.findById(questionId);
        if (!q)
            return res.status(404).json({ message: "Question not found" });
        const isOwner = String(q.authorId) === String(req.user.id);
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: "Only the question owner can accept an answer" });
        }
        const isFundedFastResponse = Boolean(q.isFastResponse) &&
            Number(q.fastResponsePricePaisa || 0) > 0 &&
            String(q.fastResponseEscrowStatus || "none") === "funded";
        const isReleasedFastResponse = Boolean(q.isFastResponse) &&
            String(q.fastResponseEscrowStatus || "none") === "released";
        if (isReleasedFastResponse) {
            return res.status(400).json({
                message: "Reward is already released. Accepted answer cannot be changed.",
            });
        }
        const ans = await Answer.findOne({ _id: answerId, questionId });
        if (!ans)
            return res.status(404).json({ message: "Answer not found" });
        const prevAcceptedId = q.acceptedAnswerId ? String(q.acceptedAnswerId) : null;
        const nextAcceptedId = String(ans._id);
        if (prevAcceptedId && prevAcceptedId === nextAcceptedId) {
            await Answer.updateOne({ _id: ans._id }, { $set: { isVerified: false } });
            await User.updateOne({ _id: ans.authorId }, { $inc: { points: -ACCEPT_POINTS, acceptedAnswers: -1 } });
            q.acceptedAnswerId = null;
            q.hasVerifiedAnswer = false;
            await q.save();
            return res.json({
                message: "Answer unaccepted",
                acceptedAnswerId: null,
                hasVerifiedAnswer: false,
            });
        }
        if (q.acceptedAnswerId) {
            const prev = await Answer.findById(q.acceptedAnswerId).lean();
            await Answer.updateOne({ _id: q.acceptedAnswerId }, { $set: { isVerified: false } });
            if (prev?.authorId) {
                await User.updateOne({ _id: prev.authorId }, { $inc: { points: -ACCEPT_POINTS, acceptedAnswers: -1 } });
            }
        }
        await Answer.updateOne({ _id: ans._id }, { $set: { isVerified: true } });
        await User.updateOne({ _id: ans.authorId }, { $inc: { points: ACCEPT_POINTS, acceptedAnswers: 1 } });
        q.acceptedAnswerId = ans._id;
        q.hasVerifiedAnswer = true;
        let payoutInfo = null;
        if (isFundedFastResponse) {
            const rewardPaisa = Number(q.fastResponsePricePaisa || 0);
            const payoutPaisa = Math.floor((rewardPaisa * (100 - FAST_RESPONSE_PLATFORM_FEE_PERCENT)) / 100);
            const feePaisa = Math.max(0, rewardPaisa - payoutPaisa);
            const credited = await creditUserWallet({
                userId: String(ans.authorId),
                amountPaisa: payoutPaisa,
                type: "fast_response_reward_credit",
                note: "Fast response reward payout",
                referenceId: `fast-response-payout-${questionId}`,
                metadata: {
                    questionId,
                    answerId: String(ans._id),
                    rewardPaisa,
                    payoutPaisa,
                    feePaisa,
                    feePercent: FAST_RESPONSE_PLATFORM_FEE_PERCENT,
                },
            });
            if (!credited.ok) {
                return res.status(500).json({
                    message: credited.error || "Failed to release fast response reward",
                });
            }
            q.fastResponseEscrowStatus = "released";
            q.fastResponseWinnerAnswerId = ans._id;
            q.fastResponsePayoutPaisa = payoutPaisa;
            q.fastResponsePlatformFeePaisa = feePaisa;
            q.fastResponseReleasedAt = new Date();
            payoutInfo = { rewardPaisa, payoutPaisa, feePaisa };
            const winnerId = String(ans.authorId);
            const ownerId = String(q.authorId);
            if (winnerId) {
                await createNotification({
                    userId: winnerId,
                    actorId: ownerId,
                    type: "system",
                    title: "Fast response reward received",
                    message: `You received NPR ${(payoutPaisa / 100).toFixed(2)} for accepted answer.`,
                    link: `/questions/${questionId}`,
                    metadata: { questionId, answerId: String(ans._id), payoutPaisa, feePaisa },
                });
            }
        }
        await q.save();
        return res.json({
            message: "Answer accepted",
            acceptedAnswerId: String(ans._id),
            hasVerifiedAnswer: true,
            ...(payoutInfo
                ? {
                    reward: {
                        total: Number((payoutInfo.rewardPaisa / 100).toFixed(2)),
                        paidToWinner: Number((payoutInfo.payoutPaisa / 100).toFixed(2)),
                        platformFee: Number((payoutInfo.feePaisa / 100).toFixed(2)),
                    },
                }
                : {}),
        });
    }
    catch {
        return res.status(500).json({ message: "Failed to accept answer" });
    }
};
export const updateAnswer = async (req, res) => {
    try {
        const { id: questionId, answerId } = req.params;
        const { content } = req.body;
        if (!req.user?.id)
            return res.status(401).json({ message: "Unauthorized" });
        if (!content || String(content).trim().length < 10) {
            return res.status(400).json({ message: "Answer must be at least 10 characters" });
        }
        const ans = await Answer.findOne({ _id: answerId, questionId });
        if (!ans)
            return res.status(404).json({ message: "Answer not found" });
        const isOwner = String(ans.authorId) === String(req.user.id);
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: "Not allowed" });
        }
        ans.content = String(content).trim();
        await ans.save();
        return res.json({
            message: "Answer updated",
            answer: {
                id: ans._id,
                questionId: ans.questionId,
                content: ans.content,
                votes: ans.votes,
                isVerified: ans.isVerified,
                createdAt: ans.createdAt,
                updatedAt: ans.updatedAt,
            },
        });
    }
    catch {
        return res.status(500).json({ message: "Failed to update answer" });
    }
};
export const deleteAnswer = async (req, res) => {
    try {
        const { id: questionId, answerId } = req.params;
        if (!req.user?.id)
            return res.status(401).json({ message: "Unauthorized" });
        const ans = await Answer.findOne({ _id: answerId, questionId });
        if (!ans)
            return res.status(404).json({ message: "Answer not found" });
        const isOwner = String(ans.authorId) === String(req.user.id);
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: "Not allowed" });
        }
        const q = await Question.findById(questionId);
        if (q && String(q.acceptedAnswerId || "") === String(ans._id)) {
            q.acceptedAnswerId = undefined;
            q.hasVerifiedAnswer = false;
            await q.save();
        }
        await Answer.deleteOne({ _id: answerId });
        await Question.findByIdAndUpdate(questionId, { $inc: { answersCount: -1 } });
        return res.json({ message: "Answer deleted" });
    }
    catch {
        return res.status(500).json({ message: "Failed to delete answer" });
    }
};
const applyVote = (existing, next) => {
    if (existing === next) {
        return { newValue: null, delta: -next };
    }
    if (existing === null) {
        return { newValue: next, delta: next };
    }
    return { newValue: next, delta: next - existing };
};
export const upvoteAnswer = async (req, res) => {
    try {
        const { id: questionId, answerId } = req.params;
        if (!req.user?.id)
            return res.status(401).json({ message: "Unauthorized" });
        const ans = await Answer.findOne({ _id: answerId, questionId });
        if (!ans)
            return res.status(404).json({ message: "Answer not found" });
        const userId = String(req.user.id);
        const idx = ans.voters.findIndex((v) => String(v.userId) === userId);
        const existing = idx >= 0 ? Number(ans.voters[idx].value) : null;
        const { newValue, delta } = applyVote(existing, 1);
        if (newValue === null) {
            ans.voters = ans.voters.filter((v) => String(v.userId) !== userId);
        }
        else if (idx >= 0) {
            ans.voters[idx].value = newValue;
        }
        else {
            ans.voters.push({ userId: req.user.id, value: newValue });
        }
        ans.votes = Math.max(0, Number(ans.votes || 0) + delta);
        await ans.save();
        return res.json({ message: "Voted", votes: ans.votes, myVote: newValue });
    }
    catch {
        return res.status(500).json({ message: "Failed to upvote answer" });
    }
};
export const downvoteAnswer = async (req, res) => {
    try {
        const { id: questionId, answerId } = req.params;
        if (!req.user?.id)
            return res.status(401).json({ message: "Unauthorized" });
        const ans = await Answer.findOne({ _id: answerId, questionId });
        if (!ans)
            return res.status(404).json({ message: "Answer not found" });
        const userId = String(req.user.id);
        const idx = ans.voters.findIndex((v) => String(v.userId) === userId);
        const existing = idx >= 0 ? Number(ans.voters[idx].value) : null;
        const { newValue, delta } = applyVote(existing, -1);
        if (newValue === null) {
            ans.voters = ans.voters.filter((v) => String(v.userId) !== userId);
        }
        else if (idx >= 0) {
            ans.voters[idx].value = newValue;
        }
        else {
            ans.voters.push({ userId: req.user.id, value: newValue });
        }
        ans.votes = Math.max(0, Number(ans.votes || 0) + delta);
        await ans.save();
        return res.json({ message: "Voted", votes: ans.votes, myVote: newValue });
    }
    catch {
        return res.status(500).json({ message: "Failed to downvote answer" });
    }
};
