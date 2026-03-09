import { http } from "./http";

export type WalletTransaction = {
  id: string;
  type: string;
  direction: "credit" | "debit";
  amountPaisa: number;
  amount: number;
  balanceAfterPaisa: number;
  balanceAfter: number;
  status: "completed" | "pending" | "failed";
  note: string;
  createdAt: string;
};

export type WalletSummaryResponse = {
  walletBalancePaisa: number;
  walletBalance: number;
  transactions: WalletTransaction[];
};

export type WalletInitiateTopupResponse = {
  success: boolean;
  message: string;
  paymentInfo: {
    pidx?: string;
    paymentUrl?: string;
    expiresAt?: string;
    expiresIn?: number;
  };
  error?: string;
};

export type WalletVerifyTopupResponse = {
  success: boolean;
  message: string;
  walletBalancePaisa: number;
  walletBalance: number;
  paymentInfo?: Record<string, unknown>;
  error?: string;
};

export type WalletCheckoutResponse = {
  success: boolean;
  message: string;
  walletBalancePaisa: number;
  walletBalance: number;
  error?: string;
};

export async function fetchWalletSummary() {
  return http<WalletSummaryResponse>("/api/wallet/me");
}

export async function initiateWalletTopup(payload: {
  amountPaisa: number;
  returnUrl: string;
  websiteUrl: string;
}) {
  return http<WalletInitiateTopupResponse>("/api/wallet/topup/initiate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyWalletTopup(pidx: string) {
  return http<WalletVerifyTopupResponse>("/api/wallet/topup/verify", {
    method: "POST",
    body: JSON.stringify({ pidx }),
  });
}

export async function checkoutWallet(amountPaisa: number) {
  return http<WalletCheckoutResponse>("/api/wallet/checkout", {
    method: "POST",
    body: JSON.stringify({ amountPaisa }),
  });
}
