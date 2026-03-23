import mongoose from "mongoose";
import User from "../models/User.model.js";
import WalletTransaction, { type WalletTransactionType } from "../models/WalletTransaction.model.js";

type WalletInput = {
  userId: string;
  amountPaisa: number;
  type: WalletTransactionType;
  note?: string;
  referenceId?: string | null;
  metadata?: Record<string, unknown>;
};

const parseAmountPaisa = (value: unknown) => {
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount <= 0) return 0;
  return amount;
};

export async function creditUserWallet(input: WalletInput) {
  const userId = String(input.userId || "").trim();
  const amountPaisa = parseAmountPaisa(input.amountPaisa);
  if (!mongoose.Types.ObjectId.isValid(userId) || amountPaisa <= 0) {
    return { ok: false as const, error: "Invalid wallet credit input" };
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { walletBalancePaisa: amountPaisa } },
    { new: true }
  );
  if (!user) return { ok: false as const, error: "User not found" };

  const balancePaisa = Number((user as any).walletBalancePaisa ?? 0);
  const transaction = await WalletTransaction.create({
    userId,
    type: input.type,
    direction: "credit",
    amountPaisa,
    balanceAfterPaisa: balancePaisa,
    status: "completed",
    note: String(input.note || ""),
    referenceId: input.referenceId ? String(input.referenceId) : null,
    metadata: input.metadata ?? {},
  });

  return {
    ok: true as const,
    balancePaisa,
    transactionId: String(transaction._id),
  };
}

export async function debitUserWallet(input: WalletInput) {
  const userId = String(input.userId || "").trim();
  const amountPaisa = parseAmountPaisa(input.amountPaisa);
  if (!mongoose.Types.ObjectId.isValid(userId) || amountPaisa <= 0) {
    return { ok: false as const, error: "Invalid wallet debit input" };
  }

  const user = await User.findOneAndUpdate(
    { _id: userId, walletBalancePaisa: { $gte: amountPaisa } },
    { $inc: { walletBalancePaisa: -amountPaisa } },
    { new: true }
  );
  if (!user) return { ok: false as const, error: "Insufficient wallet balance" };

  const balancePaisa = Number((user as any).walletBalancePaisa ?? 0);
  const transaction = await WalletTransaction.create({
    userId,
    type: input.type,
    direction: "debit",
    amountPaisa,
    balanceAfterPaisa: balancePaisa,
    status: "completed",
    note: String(input.note || ""),
    referenceId: input.referenceId ? String(input.referenceId) : null,
    metadata: input.metadata ?? {},
  });

  return {
    ok: true as const,
    balancePaisa,
    transactionId: String(transaction._id),
  };
}
