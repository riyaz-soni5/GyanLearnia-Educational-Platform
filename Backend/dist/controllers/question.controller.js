import { Types } from "mongoose";
import axios from "axios";
import Question from "../models/Question.model.js";
import User from "../models/User.model.js";
import WalletTransaction from "../models/WalletTransaction.model.js";
import Course from "../models/Course.model.js";
import Enrollment from "../models/Enrollment.model.js";
import { creditUserWallet, debitUserWallet } from "../services/wallet.service.js";
import { createNotification } from "../services/notification.service.js";
const KHALTI_LOOKUP_URL = "https://khalti.com/api/v2/epayment/lookup/";
const MIN_FAST_RESPONSE_PRICE_NPR = 10;
const normalizeKhaltiSecretKey = (raw) => {
    const value = String(raw || "").trim();
    if (!value)
        return "";
    if (value.startsWith("test_secret_key_"))
        return value.replace("test_secret_key_", "");
    if (value.startsWith("live_secret_key_"))
        return value.replace("live_secret_key_", "");
    return value;
};
const formatKhaltiError = (payload) => {
    if (!payload)
        return "Khalti verification failed";
    if (typeof payload === "string")
        return payload;
    if (typeof payload !== "object")
        return "Khalti verification failed";
    const data = payload;
    if (typeof data.detail === "string" && data.detail.trim())
        return data.detail;
    if (typeof data.error_key === "string" && data.error_key.trim())
        return data.error_key;
    const first = Object.values(data).find((value) => typeof value === "string");
    if (typeof first === "string" && first.trim())
        return first;
    return "Khalti verification failed";
};
const isActiveProPlan = (user) => {
    const rawPlan = String(user?.plan ?? "Free");
    if (rawPlan !== "Pro")
        return false;
    const rawExpiry = user?.planExpiresAt ? new Date(user.planExpiresAt) : null;
    if (!rawExpiry || Number.isNaN(rawExpiry.getTime()))
        return true;
    return rawExpiry.getTime() > Date.now();
};
const parsePriceNpr = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount))
        return 0;
    return Math.floor(amount);
};
const normalizeQuestionScope = (value) => String(value || "").trim().toLowerCase() === "course" ? "course" : "global";
const getQuestionLink = (questionId, scope, courseId) => {
    const normalizedScope = normalizeQuestionScope(scope);
    const normalizedCourseId = String(courseId || "").trim();
    if (normalizedScope === "course" && normalizedCourseId) {
        return `/courses/${normalizedCourseId}/learn?tab=qa`;
    }
    return `/questions/${questionId}`;
};
export const listQuestions = async (req, res) => {
    const { q = "", query = "", categoryId = "All", level = "All", sort = "Newest", status = "All", page = "1", limit = "10", scope = "global", courseId = "", } = req.query;
    const searchText = String(q || query).trim();
    const normalizedScope = normalizeQuestionScope(scope);
    const normalizedCourseId = String(courseId || "").trim();
    const filter = {};
    filter.scope = normalizedScope === "course" ? "course" : { $ne: "course" };
    if (normalizedScope === "course") {
        if (!req.user?.id)
            return res.status(401).json({ message: "Unauthorized" });
        if (!normalizedCourseId || !Types.ObjectId.isValid(normalizedCourseId)) {
            return res.status(400).json({ message: "Valid courseId is required for course discussions." });
        }
        const enrollment = await Enrollment.findOne({
            userId: String(req.user.id),
            courseId: normalizedCourseId,
        })
            .select("_id")
            .lean();
        if (!enrollment) {
            return res.status(403).json({ message: "Enroll in this course to view its discussion." });
        }
        filter.courseId = normalizedCourseId;
    }
    if (searchText) {
        const searchRegex = new RegExp(searchText, "i");
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
        const myVote = meId ? (q.voters?.find((v) => String(v.userId) === meId)?.value ?? null) : null;
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
            scope: normalizeQuestionScope(q.scope),
            courseId: q.courseId ? String(q.courseId) : undefined,
            votes: q.votes ?? 0,
            myVote,
            views: q.views ?? 0,
            answersCount: q.answersCount ?? 0,
            isFastResponse: q.isFastResponse ?? false,
            fastResponsePrice: Number((Number(q.fastResponsePricePaisa || 0) / 100).toFixed(2)),
            fastResponseEscrowStatus: String(q.fastResponseEscrowStatus || "none"),
            hasVerifiedAnswer: q.hasVerifiedAnswer ?? false,
            status: q.hasVerifiedAnswer ? "Answered" : "Unanswered",
            createdAt: q.createdAt ? new Date(q.createdAt).toISOString() : undefined,
            updatedAt: q.updatedAt ? new Date(q.updatedAt).toISOString() : undefined,
            author: authorObj?.firstName && authorObj?.lastName
                ? `${authorObj.firstName} ${authorObj.lastName}`
                : authorObj?.fullName || authorObj?.name || authorObj?.username || "Anonymous",
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
    if (userId) {
        q = await Question.findOneAndUpdate({
            _id: id,
            authorId: { $ne: userId },
            viewedBy: { $ne: userId },
        }, {
            $inc: { views: 1 },
            $addToSet: { viewedBy: userId },
        }, { new: true })
            .populate("categoryId", "name")
            .populate("authorId", "firstName lastName fullName name username role avatarUrl")
            .lean();
    }
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
    if (!q) {
        q = await Question.findById(id)
            .populate("categoryId", "name")
            .populate("authorId", "firstName lastName fullName name username role avatarUrl")
            .lean();
    }
    if (!q)
        return res.status(404).json({ message: "Question not found" });
    const meId = req.user?.id ? String(req.user.id) : null;
    const myVote = meId ? (q.voters?.find((v) => String(v.userId) === meId)?.value ?? null) : null;
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
            scope: normalizeQuestionScope(q.scope),
            courseId: q.courseId ? String(q.courseId) : undefined,
            votes: q.votes ?? 0,
            myVote,
            views: q.views ?? 0,
            answersCount: q.answersCount ?? 0,
            isFastResponse: q.isFastResponse ?? false,
            fastResponsePrice: Number((Number(q.fastResponsePricePaisa || 0) / 100).toFixed(2)),
            fastResponseEscrowStatus: String(q.fastResponseEscrowStatus || "none"),
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
    const { title, excerpt, categoryId, level, tags = [], isFastResponse = false, fastResponsePrice = 0, fastResponsePaymentMode = "", fastResponseKhaltiPidx = "", scope = "global", courseId = "", } = req.body || {};
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
    const userId = String(req.user?.id || "").trim();
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    const user = await User.findById(userId).select("plan planExpiresAt").lean();
    if (!user)
        return res.status(404).json({ message: "User not found" });
    const normalizedScope = normalizeQuestionScope(scope);
    const normalizedCourseId = String(courseId || "").trim();
    if (normalizedScope === "course") {
        if (!normalizedCourseId || !Types.ObjectId.isValid(normalizedCourseId)) {
            return res.status(400).json({ message: "Valid courseId is required." });
        }
        const course = await Course.findById(normalizedCourseId).select("_id").lean();
        if (!course)
            return res.status(404).json({ message: "Course not found" });
        const enrollment = await Enrollment.findOne({ userId, courseId: normalizedCourseId })
            .select("_id")
            .lean();
        if (!enrollment) {
            return res.status(403).json({ message: "Enroll in this course to join its discussion." });
        }
    }
    const mode = String(fastResponsePaymentMode || "").trim().toLowerCase();
    const isFast = Boolean(isFastResponse);
    if (normalizedScope === "course" && isFast) {
        return res.status(400).json({ message: "Fast response is only available for public questions." });
    }
    const isPro = isActiveProPlan(user);
    const priceNpr = parsePriceNpr(fastResponsePrice);
    const pricePaisa = Math.max(0, priceNpr * 100);
    let walletDebitInfo = null;
    let fastResponsePricePaisa = 0;
    let fastResponseEscrowStatus = "none";
    let fastResponseEscrowSource = "none";
    let fastResponseEscrowSourceRef = null;
    if (isFast) {
        if (isPro && (!mode || mode === "pro")) {
            fastResponseEscrowSource = "pro";
            fastResponseEscrowStatus = "none";
            fastResponsePricePaisa = 0;
        }
        else {
            if (priceNpr < MIN_FAST_RESPONSE_PRICE_NPR) {
                return res.status(400).json({
                    message: `Fast response price must be at least NPR ${MIN_FAST_RESPONSE_PRICE_NPR}`,
                });
            }
            if (!["wallet", "khalti"].includes(mode)) {
                return res.status(400).json({
                    message: "Free users must choose wallet or Khalti payment for fast response",
                });
            }
            fastResponsePricePaisa = pricePaisa;
            fastResponseEscrowStatus = "funded";
            if (mode === "wallet") {
                const debited = await debitUserWallet({
                    userId,
                    amountPaisa: pricePaisa,
                    type: "fast_response_escrow_debit",
                    note: "Fast response escrow funded from wallet",
                    referenceId: `fast-response-${Date.now()}`,
                    metadata: { priceNpr },
                });
                if (!debited.ok) {
                    return res.status(400).json({
                        message: debited.error || "Insufficient wallet balance",
                    });
                }
                walletDebitInfo = {
                    amountPaisa: pricePaisa,
                    txId: String(debited.transactionId || ""),
                };
                fastResponseEscrowSource = "wallet";
                fastResponseEscrowSourceRef = walletDebitInfo.txId || null;
            }
            else if (mode === "khalti") {
                const pidx = String(fastResponseKhaltiPidx || "").trim();
                if (!pidx) {
                    return res.status(400).json({ message: "Khalti pidx is required for direct payment" });
                }
                const alreadyUsed = await Question.findOne({
                    isFastResponse: true,
                    fastResponseEscrowSource: "khalti",
                    fastResponseEscrowSourceRef: pidx,
                })
                    .select("_id")
                    .lean();
                if (alreadyUsed) {
                    return res.status(409).json({ message: "This Khalti payment reference is already used" });
                }
                const usedInWalletTopup = await WalletTransaction.findOne({
                    type: "wallet_topup",
                    status: "completed",
                    "metadata.pidx": pidx,
                })
                    .select("_id")
                    .lean();
                if (usedInWalletTopup) {
                    return res.status(409).json({
                        message: "This Khalti payment reference is already used",
                    });
                }
                const khaltiSecretKey = normalizeKhaltiSecretKey(process.env.KHALTI_SECRET_KEY ?? process.env.KHALTI_TEST_SECRET_KEY ?? "");
                if (!khaltiSecretKey) {
                    return res.status(500).json({ message: "Khalti secret key is missing" });
                }
                try {
                    const lookup = await axios.post(KHALTI_LOOKUP_URL, { pidx }, {
                        headers: {
                            Authorization: `Key ${khaltiSecretKey}`,
                            "Content-Type": "application/json",
                        },
                        timeout: 15000,
                    });
                    const lookupData = lookup.data;
                    const status = String(lookupData.status || "");
                    if (status !== "Completed") {
                        return res.status(400).json({
                            message: status ? `Payment status: ${status}` : "Payment is not completed",
                        });
                    }
                    const paidPaisa = Number(lookupData.total_amount || 0);
                    if (!Number.isFinite(paidPaisa) || paidPaisa < pricePaisa) {
                        return res.status(400).json({
                            message: "Paid amount is lower than selected fast response price",
                        });
                    }
                    fastResponseEscrowSource = "khalti";
                    fastResponseEscrowSourceRef = pidx;
                }
                catch (error) {
                    if (axios.isAxiosError(error)) {
                        return res.status(502).json({
                            message: formatKhaltiError(error.response?.data) ||
                                error.message ||
                                "Failed to verify Khalti payment",
                        });
                    }
                    return res.status(500).json({ message: "Failed to verify Khalti payment" });
                }
            }
        }
    }
    try {
        const doc = await Question.create({
            title: title.trim(),
            excerpt: excerpt.trim(),
            categoryId,
            level,
            tags: Array.isArray(tags) ? tags.slice(0, 8) : [],
            scope: normalizedScope,
            courseId: normalizedScope === "course" ? normalizedCourseId : null,
            isFastResponse: isFast,
            fastResponsePricePaisa,
            fastResponseEscrowStatus,
            fastResponseEscrowSource,
            fastResponseEscrowSourceRef,
            authorId: userId,
        });
        if (isFast && fastResponsePricePaisa > 0 && fastResponseEscrowStatus === "funded") {
            await createNotification({
                userId,
                type: "system",
                title: "Fast response question posted",
                message: `Escrow of NPR ${(fastResponsePricePaisa / 100).toFixed(2)} is locked and will be paid to the accepted answer.`,
                link: getQuestionLink(String(doc._id), normalizedScope, normalizedCourseId),
                metadata: { questionId: String(doc._id), amountPaisa: fastResponsePricePaisa },
            });
        }
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
                scope: normalizeQuestionScope(doc.scope),
                courseId: doc.courseId ? String(doc.courseId) : undefined,
                isFastResponse: doc.isFastResponse,
                fastResponsePrice: Number((Number(doc.fastResponsePricePaisa || 0) / 100).toFixed(2)),
                fastResponseEscrowStatus: String(doc.fastResponseEscrowStatus || "none"),
                createdAt: doc.createdAt,
            },
        });
    }
    catch {
        if (walletDebitInfo && walletDebitInfo.amountPaisa > 0) {
            await creditUserWallet({
                userId,
                amountPaisa: walletDebitInfo.amountPaisa,
                type: "fast_response_escrow_refund",
                note: "Fast response escrow refund",
                referenceId: walletDebitInfo.txId || null,
            }).catch(() => null);
            await createNotification({
                userId,
                type: "system",
                title: "Wallet debit rolled back",
                message: "Fast response payment was rolled back due to a posting error.",
                link: "/questions/ask",
            }).catch(() => null);
        }
        return res.status(500).json({ message: "Failed to create question" });
    }
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
            fastResponsePrice: Number((Number(q.fastResponsePricePaisa || 0) / 100).toFixed(2)),
            fastResponseEscrowStatus: String(q.fastResponseEscrowStatus || "none"),
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
    const escrowStatus = String(q.fastResponseEscrowStatus || "none");
    const escrowSource = String(q.fastResponseEscrowSource || "none");
    const escrowAmountPaisa = Number(q.fastResponsePricePaisa || 0);
    if (Boolean(q.isFastResponse) &&
        escrowStatus === "funded" &&
        escrowAmountPaisa > 0 &&
        (escrowSource === "wallet" || escrowSource === "khalti")) {
        const refunded = await creditUserWallet({
            userId: String(q.authorId),
            amountPaisa: escrowAmountPaisa,
            type: "fast_response_escrow_refund",
            note: "Fast response escrow refunded after question deletion",
            referenceId: `fast-response-refund-${String(q._id)}`,
            metadata: {
                questionId: String(q._id),
                source: escrowSource,
            },
        });
        if (!refunded.ok) {
            return res
                .status(500)
                .json({ message: refunded.error || "Failed to refund fast response escrow" });
        }
        await createNotification({
            userId: String(q.authorId),
            type: "system",
            title: "Fast response reward refunded",
            message: `NPR ${(escrowAmountPaisa / 100).toFixed(2)} was returned to your wallet.`,
            link: "/wallet",
            metadata: { questionId: String(q._id), amountPaisa: escrowAmountPaisa, source: escrowSource },
        });
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
