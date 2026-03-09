// controllers/question.controller.ts
import { Response } from "express";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import type { SortOrder } from "mongoose";
import axios from "axios";
import Question from "../models/Question.model.js";
import User from "../models/User.model.js";
import WalletTransaction from "../models/WalletTransaction.model.js";
import { creditUserWallet, debitUserWallet } from "../services/wallet.service.js";
import { createNotification } from "../services/notification.service.js";

const KHALTI_LOOKUP_URL = "https://dev.khalti.com/api/v2/epayment/lookup/";
const MIN_FAST_RESPONSE_PRICE_NPR = 10;

const normalizeKhaltiSecretKey = (raw: string): string => {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (value.startsWith("test_secret_key_")) return value.replace("test_secret_key_", "");
  if (value.startsWith("live_secret_key_")) return value.replace("live_secret_key_", "");
  return value;
};

const formatKhaltiError = (payload: unknown): string => {
  if (!payload) return "Khalti verification failed";
  if (typeof payload === "string") return payload;
  if (typeof payload !== "object") return "Khalti verification failed";

  const data = payload as Record<string, unknown>;
  if (typeof data.detail === "string" && data.detail.trim()) return data.detail;
  if (typeof data.error_key === "string" && data.error_key.trim()) return data.error_key;

  const first = Object.values(data).find((value) => typeof value === "string");
  if (typeof first === "string" && first.trim()) return first;
  return "Khalti verification failed";
};

const isActiveProPlan = (user: any): boolean => {
  const rawPlan = String(user?.plan ?? "Free");
  if (rawPlan !== "Pro") return false;
  const rawExpiry = user?.planExpiresAt ? new Date(user.planExpiresAt) : null;
  if (!rawExpiry || Number.isNaN(rawExpiry.getTime())) return true;
  return rawExpiry.getTime() > Date.now();
};

const parsePriceNpr = (value: unknown) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.floor(amount);
};

export const listQuestions = async (req: AuthedRequest, res: Response) => {
  const {
    q = "",
    query = "",
    categoryId = "All",
    level = "All",
    sort = "Newest",
    status = "All",
    page = "1",
    limit = "10",
  } = req.query;

  const searchText = String(q || query).trim();
  const filter: any = {};

  if (searchText) {
    const searchRegex = new RegExp(searchText, "i");
    // Search by title, description(excerpt), and tags.
    filter.$or = [
      { title: searchRegex },
      { excerpt: searchRegex },
      { tags: searchRegex },
    ];
  }
  if (categoryId !== "All") filter.categoryId = categoryId;
  if (level !== "All") filter.level = level;
  if (status === "Answered") filter.hasVerifiedAnswer = true;
  if (status === "Unanswered") filter.hasVerifiedAnswer = false;

  const sortKey = String(sort).trim().toLowerCase();
  if (sortKey === "answered") filter.hasVerifiedAnswer = true;
  if (sortKey === "unanswered") filter.hasVerifiedAnswer = false;
  if (sortKey === "fast response" || sortKey === "fast_response" || sortKey === "fastresponse") {
    filter.isFastResponse = true;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const sortObj: Record<string, SortOrder> =
    sortKey === "most viewed"
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
])) as any;

  const meId = req.user?.id ? String(req.user.id) : null;

  const mapped = items.map((q: any) => {
  const authorObj = q.authorId as any;
  const myVote =
    meId
      ? (q.voters?.find((v: any) => String(v.userId) === meId)?.value ?? null)
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
    fastResponsePrice: Number((Number(q.fastResponsePricePaisa || 0) / 100).toFixed(2)),
    fastResponseEscrowStatus: String(q.fastResponseEscrowStatus || "none"),
    hasVerifiedAnswer: q.hasVerifiedAnswer ?? false,

    status: q.hasVerifiedAnswer ? "Answered" : "Unanswered",

    createdAt: q.createdAt
      ? new Date(q.createdAt).toISOString()
      : undefined,
    updatedAt: q.updatedAt
      ? new Date(q.updatedAt).toISOString()
      : undefined,
      author:
  authorObj?.firstName && authorObj?.lastName
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

export const getQuestion = async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;

  const userId = req.user?.id;

  const ipRaw =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    "";
  const ip = String(ipRaw).split(",")[0].trim();
  const ua = String(req.headers["user-agent"] || "");
  const guestKey = `${ip}::${ua}`;

  let q: any = null;

  // ✅ Logged-in user logic
  if (userId) {
    q = await Question.findOneAndUpdate(
      {
        _id: id,
        authorId: { $ne: userId },   // owner view should NOT count
        viewedBy: { $ne: userId },   // already viewed should NOT count
      },
      {
        $inc: { views: 1 },
        $addToSet: { viewedBy: userId },
      },
      { new: true }
    )
      .populate("categoryId", "name")
      .populate("authorId", "firstName lastName fullName name username role avatarUrl")
      .lean();
  } 
  // ✅ Guest logic
  else {
    q = await Question.findOneAndUpdate(
      {
        _id: id,
        viewedKeys: { $ne: guestKey },
      },
      {
        $inc: { views: 1 },
        $addToSet: { viewedKeys: guestKey },
      },
      { new: true }
    )
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

  if (!q) return res.status(404).json({ message: "Question not found" });
  const meId = req.user?.id ? String(req.user.id) : null;

const myVote =
  meId
    ? (q.voters?.find((v: any) => String(v.userId) === meId)?.value ?? null)
    : null;

  const authorObj = q.authorId as any;

  const authorName =
    authorObj?.firstName && authorObj?.lastName
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

export const createQuestion = async (req: AuthedRequest, res: Response) => {
  const {
    title,
    excerpt,
    categoryId,
    level,
    tags = [],
    isFastResponse = false,
    fastResponsePrice = 0,
    fastResponsePaymentMode = "",
    fastResponseKhaltiPidx = "",
  } = req.body || {};

  if (!title || title.trim().length < 10) {
    return res.status(400).json({ message: "Title must be at least 10 characters." });
  }
  if (!excerpt || excerpt.trim().length < 20) {
    return res.status(400).json({ message: "Question details must be at least 20 characters." });
  }
  if (!categoryId) return res.status(400).json({ message: "Category is required." });
  if (!level) return res.status(400).json({ message: "Level is required." });

  const userId = String(req.user?.id || "").trim();
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const user = await User.findById(userId).select("plan planExpiresAt").lean();
  if (!user) return res.status(404).json({ message: "User not found" });

  const mode = String(fastResponsePaymentMode || "").trim().toLowerCase();
  const isFast = Boolean(isFastResponse);
  const isPro = isActiveProPlan(user);
  const priceNpr = parsePriceNpr(fastResponsePrice);
  const pricePaisa = Math.max(0, priceNpr * 100);
  let walletDebitInfo: { amountPaisa: number; txId: string } | null = null;

  let fastResponsePricePaisa = 0;
  let fastResponseEscrowStatus: "none" | "funded" = "none";
  let fastResponseEscrowSource: "none" | "wallet" | "khalti" | "pro" = "none";
  let fastResponseEscrowSourceRef: string | null = null;

  if (isFast) {
    if (isPro && (!mode || mode === "pro")) {
      fastResponseEscrowSource = "pro";
      fastResponseEscrowStatus = "none";
      fastResponsePricePaisa = 0;
    } else {
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
      } else if (mode === "khalti") {
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

        const khaltiTestSecretKey = normalizeKhaltiSecretKey(process.env.KHALTI_TEST_SECRET_KEY ?? "");
        if (!khaltiTestSecretKey) {
          return res.status(500).json({ message: "Khalti test secret key is missing" });
        }

        try {
          const lookup = await axios.post(
            KHALTI_LOOKUP_URL,
            { pidx },
            {
              headers: {
                Authorization: `Key ${khaltiTestSecretKey}`,
                "Content-Type": "application/json",
              },
              timeout: 15000,
            }
          );

          const lookupData = lookup.data as Record<string, unknown>;
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
        } catch (error: unknown) {
          if (axios.isAxiosError(error)) {
            return res.status(502).json({
              message:
                formatKhaltiError(error.response?.data) ||
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
        message: `Escrow of NPR ${(fastResponsePricePaisa / 100).toFixed(
          2
        )} is locked and will be paid to the accepted answer.`,
        link: `/questions/${doc._id}`,
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
        isFastResponse: doc.isFastResponse,
        fastResponsePrice: Number((Number((doc as any).fastResponsePricePaisa || 0) / 100).toFixed(2)),
        fastResponseEscrowStatus: String((doc as any).fastResponseEscrowStatus || "none"),
        createdAt: doc.createdAt,
      },
    });
  } catch {
    if (walletDebitInfo && walletDebitInfo.amountPaisa > 0) {
      // best-effort refund if question creation fails after wallet debit
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


export const updateQuestion = async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const { title, excerpt } = req.body || {};

  if (title && String(title).trim().length < 10) {
    return res.status(400).json({ message: "Title must be at least 10 characters." });
  }
  if (excerpt && String(excerpt).trim().length < 20) {
    return res.status(400).json({ message: "Question details must be at least 20 characters." });
  }

  const q = await Question.findById(id);
  if (!q) return res.status(404).json({ message: "Question not found" });

  // ✅ only owner can edit
  if (String(q.authorId) !== String(req.user?.id)) {
    return res.status(403).json({ message: "Not allowed" });
  }

  if (title !== undefined) q.title = String(title).trim();
  if (excerpt !== undefined) q.excerpt = String(excerpt).trim();

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
      fastResponsePrice: Number((Number((q as any).fastResponsePricePaisa || 0) / 100).toFixed(2)),
      fastResponseEscrowStatus: String((q as any).fastResponseEscrowStatus || "none"),
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

export const deleteQuestion = async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;

  const q = await Question.findById(id);
  if (!q) return res.status(404).json({ message: "Question not found" });

  if (String(q.authorId) !== String(req.user?.id)) {
    return res.status(403).json({ message: "Not allowed" });
  }

  const escrowStatus = String((q as any).fastResponseEscrowStatus || "none");
  const escrowSource = String((q as any).fastResponseEscrowSource || "none");
  const escrowAmountPaisa = Number((q as any).fastResponsePricePaisa || 0);

  if (
    Boolean((q as any).isFastResponse) &&
    escrowStatus === "funded" &&
    escrowAmountPaisa > 0 &&
    (escrowSource === "wallet" || escrowSource === "khalti")
  ) {
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


const applyVote = (existing: number | null, next: 1 | -1) => {
  if (existing === next) return { newValue: null, delta: -next };
  if (existing === null) return { newValue: next, delta: next };
  return { newValue: next, delta: next - existing };
};

// POST /api/questions/:id/upvote
export const upvoteQuestion = async (req: AuthedRequest, res: Response) => {
  try {
    const { id: questionId } = req.params;
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const q: any = await Question.findById(questionId);
    if (!q) return res.status(404).json({ message: "Question not found" });

    const userId = String(req.user.id);

    const idx = q.voters.findIndex((v: any) => String(v.userId) === userId);
    const existing = idx >= 0 ? Number(q.voters[idx].value) : null;

    const { newValue, delta } = applyVote(existing, 1);

    if (newValue === null) {
      q.voters = q.voters.filter((v: any) => String(v.userId) !== userId);
    } else if (idx >= 0) {
      q.voters[idx].value = newValue;
    } else {
      q.voters.push({ userId: req.user.id, value: newValue });
    }

    q.votes = Number(q.votes || 0) + delta;
    await q.save();

    return res.json({ message: "Voted", votes: q.votes, myVote: newValue });
  } catch {
    return res.status(500).json({ message: "Failed to upvote question" });
  }
};

// POST /api/questions/:id/downvote
export const downvoteQuestion = async (req: AuthedRequest, res: Response) => {
  try {
    const { id: questionId } = req.params;
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const q: any = await Question.findById(questionId);
    if (!q) return res.status(404).json({ message: "Question not found" });

    const userId = String(req.user.id);

    const idx = q.voters.findIndex((v: any) => String(v.userId) === userId);
    const existing = idx >= 0 ? Number(q.voters[idx].value) : null;

    const { newValue, delta } = applyVote(existing, -1);

    if (newValue === null) {
      q.voters = q.voters.filter((v: any) => String(v.userId) !== userId);
    } else if (idx >= 0) {
      q.voters[idx].value = newValue;
    } else {
      q.voters.push({ userId: req.user.id, value: newValue });
    }

    q.votes = Number(q.votes || 0) + delta;
    await q.save();

    return res.json({ message: "Voted", votes: q.votes, myVote: newValue });
  } catch {
    return res.status(500).json({ message: "Failed to downvote question" });
  }
};
