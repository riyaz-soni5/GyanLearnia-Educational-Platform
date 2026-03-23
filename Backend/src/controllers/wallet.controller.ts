import axios from "axios";
import type { Response } from "express";
import User from "../models/User.model.js";
import WalletTransaction from "../models/WalletTransaction.model.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import { creditUserWallet, debitUserWallet } from "../services/wallet.service.js";

const KHALTI_INITIATE_URL = "https://dev.khalti.com/api/v2/epayment/initiate/";
const KHALTI_LOOKUP_URL = "https://dev.khalti.com/api/v2/epayment/lookup/";
const MIN_WALLET_AMOUNT_PAISA = 1000;

const normalizeKhaltiSecretKey = (raw: string): string => {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  if (value.startsWith("test_secret_key_")) return value.replace("test_secret_key_", "");
  if (value.startsWith("live_secret_key_")) return value.replace("live_secret_key_", "");
  return value;
};

const isValidHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const asPaisa = (value: unknown): number => {
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount <= 0) return 0;
  return amount;
};

const formatKhaltiError = (payload: unknown): string => {
  if (!payload) return "Khalti request failed";
  if (typeof payload === "string") return payload;
  if (typeof payload !== "object") return "Khalti request failed";

  const data = payload as Record<string, unknown>;
  if (typeof data.detail === "string" && data.detail.trim()) return data.detail;
  if (typeof data.error_key === "string" && data.error_key.trim()) return data.error_key;

  const first = Object.values(data).find((value) => typeof value === "string");
  if (typeof first === "string" && first.trim()) return first;
  return "Khalti request failed";
};

export async function getWalletSummary(req: AuthedRequest, res: Response) {
  try {
    const userId = String(req.user?.id || "").trim();
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const [user, transactions] = await Promise.all([
      User.findById(userId).select("walletBalancePaisa").lean(),
      WalletTransaction.find({ userId }).sort({ createdAt: -1 }).limit(25).lean(),
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });

    const walletBalancePaisa = Number((user as any).walletBalancePaisa ?? 0);

    return res.json({
      walletBalancePaisa,
      walletBalance: Number((walletBalancePaisa / 100).toFixed(2)),
      transactions: transactions.map((tx: any) => ({
        id: String(tx._id),
        type: String(tx.type),
        direction: String(tx.direction),
        amountPaisa: Number(tx.amountPaisa || 0),
        amount: Number((Number(tx.amountPaisa || 0) / 100).toFixed(2)),
        balanceAfterPaisa: Number(tx.balanceAfterPaisa || 0),
        balanceAfter: Number((Number(tx.balanceAfterPaisa || 0) / 100).toFixed(2)),
        status: String(tx.status || "completed"),
        note: String(tx.note || ""),
        createdAt: tx.createdAt,
      })),
    });
  } catch {
    return res.status(500).json({ message: "Failed to load wallet" });
  }
}

export async function initiateWalletTopup(req: AuthedRequest, res: Response) {
  try {
    const userId = String(req.user?.id || "").trim();
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const amountPaisa = asPaisa(req.body?.amountPaisa);
    const returnUrl = String(req.body?.returnUrl || "").trim();
    const websiteUrl = String(req.body?.websiteUrl || "").trim();
    const khaltiTestSecretKey = normalizeKhaltiSecretKey(process.env.KHALTI_TEST_SECRET_KEY ?? "");

    if (amountPaisa < MIN_WALLET_AMOUNT_PAISA) {
      return res.status(400).json({
        success: false,
        error: "Minimum top-up is NPR 10",
      });
    }
    if (!returnUrl || !isValidHttpUrl(returnUrl)) {
      return res.status(400).json({ success: false, error: "Valid returnUrl is required" });
    }
    if (!websiteUrl || !isValidHttpUrl(websiteUrl)) {
      return res.status(400).json({ success: false, error: "Valid websiteUrl is required" });
    }
    if (!khaltiTestSecretKey) {
      return res.status(500).json({ success: false, error: "Khalti test secret key is missing" });
    }

    const purchaseOrderId = `wallet-${userId}-${Date.now()}`;

    const initiate = await axios.post(
      KHALTI_INITIATE_URL,
      {
        return_url: returnUrl,
        website_url: websiteUrl,
        amount: amountPaisa,
        purchase_order_id: purchaseOrderId,
        purchase_order_name: "Wallet Topup",
      },
      {
        headers: {
          Authorization: `Key ${khaltiTestSecretKey}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    const payload = initiate.data as Record<string, unknown>;
    const paymentUrl = String(payload.payment_url ?? "");
    if (!paymentUrl) {
      return res.status(502).json({
        success: false,
        error: "Khalti did not return a payment_url",
      });
    }

    return res.json({
      success: true,
      message: "Wallet top-up initiated",
      paymentInfo: {
        pidx: payload.pidx,
        paymentUrl,
        expiresAt: payload.expires_at,
        expiresIn: payload.expires_in,
      },
    });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return res.status(502).json({
        success: false,
        error: formatKhaltiError(error.response?.data) || error.message || "Failed to initiate top-up",
      });
    }
    return res.status(500).json({ success: false, error: "Failed to initiate top-up" });
  }
}

export async function verifyWalletTopup(req: AuthedRequest, res: Response) {
  try {
    const userId = String(req.user?.id || "").trim();
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const pidx = String(req.body?.pidx || "").trim();
    if (!pidx) return res.status(400).json({ success: false, error: "pidx is required" });

    const khaltiTestSecretKey = normalizeKhaltiSecretKey(process.env.KHALTI_TEST_SECRET_KEY ?? "");
    if (!khaltiTestSecretKey) {
      return res.status(500).json({ success: false, error: "Khalti test secret key is missing" });
    }

    const existing = await WalletTransaction.findOne({
      type: "wallet_topup",
      "metadata.pidx": pidx,
      status: "completed",
    })
      .select("userId")
      .lean();

    if (existing) {
      if (String((existing as any).userId) !== userId) {
        return res.status(409).json({
          success: false,
          error: "This payment reference is already used",
        });
      }

      const user = await User.findById(userId).select("walletBalancePaisa").lean();
      const walletBalancePaisa = Number((user as any)?.walletBalancePaisa ?? 0);
      return res.json({
        success: true,
        message: "Top-up already verified",
        walletBalancePaisa,
        walletBalance: Number((walletBalancePaisa / 100).toFixed(2)),
      });
    }

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
        success: false,
        error: status ? `Payment status: ${status}` : "Payment is not completed",
      });
    }

    const amountPaisa = asPaisa(lookupData.total_amount);
    if (amountPaisa <= 0) {
      return res.status(400).json({ success: false, error: "Invalid paid amount from Khalti" });
    }

    const credited = await creditUserWallet({
      userId,
      amountPaisa,
      type: "wallet_topup",
      note: "Wallet top-up via Khalti",
      referenceId: pidx,
      metadata: { pidx, provider: "khalti" },
    });

    if (!credited.ok) {
      return res.status(400).json({ success: false, error: credited.error });
    }

    return res.json({
      success: true,
      message: "Wallet top-up successful",
      walletBalancePaisa: credited.balancePaisa,
      walletBalance: Number((credited.balancePaisa / 100).toFixed(2)),
      paymentInfo: lookupData,
    });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return res.status(502).json({
        success: false,
        error: formatKhaltiError(error.response?.data) || error.message || "Failed to verify top-up",
      });
    }
    return res.status(500).json({ success: false, error: "Failed to verify top-up" });
  }
}

export async function checkoutWallet(req: AuthedRequest, res: Response) {
  try {
    const userId = String(req.user?.id || "").trim();
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const amountPaisa = asPaisa(req.body?.amountPaisa);
    if (amountPaisa < MIN_WALLET_AMOUNT_PAISA) {
      return res.status(400).json({
        success: false,
        error: "Minimum checkout is NPR 10",
      });
    }

    const debited = await debitUserWallet({
      userId,
      amountPaisa,
      type: "wallet_checkout",
      note: "Wallet checkout (sandbox simulation)",
      referenceId: `checkout-${Date.now()}`,
      metadata: { mode: "sandbox" },
    });

    if (!debited.ok) {
      return res.status(400).json({ success: false, error: debited.error });
    }

    return res.json({
      success: true,
      message: "Wallet checkout successful (sandbox)",
      walletBalancePaisa: debited.balancePaisa,
      walletBalance: Number((debited.balancePaisa / 100).toFixed(2)),
    });
  } catch {
    return res.status(500).json({ success: false, error: "Failed to checkout wallet" });
  }
}
