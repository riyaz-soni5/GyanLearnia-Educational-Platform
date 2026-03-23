import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/toast";
import {
  checkoutWallet,
  fetchWalletSummary,
  initiateWalletTopup,
  verifyWalletTopup,
  type WalletTransaction,
} from "@/services/wallet";

const khaltiQueryKeys = [
  "pidx",
  "status",
  "transaction_id",
  "purchase_order_id",
  "purchase_order_name",
  "total_amount",
];

const WalletPage = () => {
  const { showToast } = useToast();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [topupNpr, setTopupNpr] = useState(100);
  const [checkoutNpr, setCheckoutNpr] = useState(10);
  const [processingTopup, setProcessingTopup] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);

  const loadWallet = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWalletSummary();
      setBalance(Number(data.walletBalance || 0));
      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load wallet";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pidx = String(params.get("pidx") || "").trim();
    const statusRaw = String(params.get("status") || "").trim().toLowerCase();
    if (!pidx && !statusRaw) return;

    const cleanKhaltiParams = () => {
      const cleanUrl = new URL(window.location.href);
      khaltiQueryKeys.forEach((key) => cleanUrl.searchParams.delete(key));
      window.history.replaceState({}, document.title, `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
    };

    const isCompleted = !statusRaw || statusRaw === "completed";
    if (!isCompleted) {
      const cancelled =
        statusRaw === "cancelled" || statusRaw === "canceled" || statusRaw.includes("cancel");
      showToast(
        cancelled
          ? "Khalti top-up was cancelled."
          : `Khalti top-up did not complete (${statusRaw}).`,
        "error"
      );
      cleanKhaltiParams();
      return;
    }
    if (!pidx) {
      showToast("Payment completed but missing payment reference.", "error");
      cleanKhaltiParams();
      return;
    }

    let cancelled = false;
    const verify = async () => {
      try {
        const result = await verifyWalletTopup(pidx);
        if (cancelled) return;
        if (result.success) {
          showToast("Wallet top-up successful", "success");
          setBalance(Number(result.walletBalance || 0));
          await loadWallet();
        } else {
          showToast(result.error || "Wallet top-up verification failed", "error");
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Wallet top-up verification failed";
        showToast(msg, "error");
      } finally {
        cleanKhaltiParams();
      }
    };

    void verify();
    return () => {
      cancelled = true;
    };
  }, [loadWallet, showToast]);

  const onTopup = async () => {
    const amountNpr = Math.floor(Number(topupNpr) || 0);
    if (amountNpr < 10) {
      showToast("Minimum top-up is NPR 10", "error");
      return;
    }

    setProcessingTopup(true);
    try {
      const result = await initiateWalletTopup({
        amountPaisa: amountNpr * 100,
        returnUrl: `${window.location.origin}/wallet`,
        websiteUrl: window.location.origin,
      });

      if (!result.success || !result.paymentInfo?.paymentUrl) {
        showToast(result.error || "Could not initiate top-up", "error");
        setProcessingTopup(false);
        return;
      }

      window.location.href = String(result.paymentInfo.paymentUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not initiate top-up";
      showToast(msg, "error");
      setProcessingTopup(false);
    }
  };

  const onCheckout = async () => {
    const amountNpr = Math.floor(Number(checkoutNpr) || 0);
    if (amountNpr < 10) {
      showToast("Minimum checkout is NPR 10", "error");
      return;
    }

    setProcessingCheckout(true);
    try {
      const result = await checkoutWallet(amountNpr * 100);
      if (result.success) {
        showToast("Wallet checkout successful", "success");
        setBalance(Number(result.walletBalance || 0));
        await loadWallet();
      } else {
        showToast(result.error || "Wallet checkout failed", "error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Wallet checkout failed";
      showToast(msg, "error");
    } finally {
      setProcessingCheckout(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="text-sm text-gray-600">
        <Link to="/profile" className="font-semibold text-indigo-700 hover:text-indigo-800">
          Profile
        </Link>{" "}
        <span className="text-gray-400">/</span>{" "}
        <span className="text-gray-700">Wallet</span>
      </div>

      <section className="rounded-2xl border border-base bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-basec">Digital Wallet</h1>

        <div className="mt-5 rounded-xl border border-base p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Current Balance</p>
          <p className="mt-2 text-3xl font-bold text-basec">NPR {balance.toFixed(2)}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-base bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-basec">Load Wallet</h2>
          <label className="mt-4 block text-xs font-medium text-muted">Amount (NPR)</label>
          <input
            type="number"
            min={10}
            step={1}
            value={topupNpr}
            onChange={(e) => setTopupNpr(Number(e.target.value))}
            className="mt-2 w-full rounded-lg border border-base px-3 py-2 text-sm text-basec"
          />
          <button
            type="button"
            onClick={() => void onTopup()}
            disabled={processingTopup}
            className={`mt-4 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white ${
              processingTopup ? "cursor-not-allowed bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {processingTopup ? "Redirecting..." : "Load via Khalti"}
          </button>
        </div>

        <div className="rounded-2xl border border-base bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-basec">Checkout Wallet</h2>
          <label className="mt-4 block text-xs font-medium text-muted">Amount (NPR)</label>
          <input
            type="number"
            min={10}
            step={1}
            value={checkoutNpr}
            onChange={(e) => setCheckoutNpr(Number(e.target.value))}
            className="mt-2 w-full rounded-lg border border-base px-3 py-2 text-sm text-basec"
          />
          <button
            type="button"
            onClick={() => void onCheckout()}
            disabled={processingCheckout}
            className={`mt-4 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white ${
              processingCheckout ? "cursor-not-allowed bg-gray-400" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {processingCheckout ? "Processing..." : "Checkout"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-base bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-basec">Recent Transactions</h2>
        {loading ? (
          <p className="mt-3 text-sm text-muted">Loading transactions...</p>
        ) : transactions.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Direction</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Balance After</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-base">
                    <td className="py-2 text-basec">{tx.type}</td>
                    <td className="py-2 text-basec">{tx.direction}</td>
                    <td className="py-2 text-basec">NPR {Number(tx.amount || 0).toFixed(2)}</td>
                    <td className="py-2 text-basec">NPR {Number(tx.balanceAfter || 0).toFixed(2)}</td>
                    <td className="py-2 text-muted">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">No wallet transactions yet.</p>
        )}
      </section>
    </div>
  );
};

export default WalletPage;
