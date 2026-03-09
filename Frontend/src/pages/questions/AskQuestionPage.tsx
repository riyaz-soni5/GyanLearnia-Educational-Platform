// src/pages/AskQuestionPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { createQuestion } from "@/services/questions";
import { fetchCategories } from "@/services/category";
import type { CategoryDTO } from "@/services/category";
import RichTextEditor from "@/components/RichTextEditor";
import { useToast } from "@/components/toast";
import { getUser } from "@/services/session";
import { fetchWalletSummary } from "@/services/wallet";


const LEVELS = ["School", "+2/High School", "Bachelor", "Master", "PhD", "Others"] as const;
const MIN_FAST_RESPONSE_PRICE_NPR = 10;
const ASK_DRAFT_KEY = "gyanlearnia_ask_question_draft";

type PaymentInitiateResponse = {
  success: boolean;
  message?: string;
  error?: string;
  paymentInfo?: {
    paymentUrl?: string;
    pidx?: string;
  };
};

const AskQuestionPage = () => {
  const nav = useNavigate();

  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");


  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");


  const [level, setLevel] = useState<(typeof LEVELS)[number]>("School");
  const [fast, setFast] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fastFreeOption, setFastFreeOption] = useState<"upgrade" | "pay">("upgrade");
  const [fastPriceNpr, setFastPriceNpr] = useState<number>(MIN_FAST_RESPONSE_PRICE_NPR);
  const [fastPaymentMode, setFastPaymentMode] = useState<"wallet" | "khalti">("wallet");
  const [fastKhaltiPidx, setFastKhaltiPidx] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [khaltiLoading, setKhaltiLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const sessionUser = getUser();
  const isProUser =
    String(sessionUser?.currentPlan ?? "Free") === "Pro" &&
    String(sessionUser?.planStatus ?? "Active") !== "Expired";


  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetchCategories();
        if (!alive) return;

        const items = res.items ?? [];
        setCategories(items);


        if (items.length && !categoryId) {
          setCategoryId(items[0].id);
        }
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Failed to load categories");
      }
    })();

    return () => {
      alive = false;
    };

  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pidx = String(params.get("pidx") || "").trim();
    const statusRaw = String(params.get("status") || "").trim().toLowerCase();
    if (!pidx && !statusRaw) return;

    try {
      const rawDraft = sessionStorage.getItem(ASK_DRAFT_KEY);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft) as {
          title?: string;
          excerpt?: string;
          categoryId?: string;
          level?: (typeof LEVELS)[number];
          tags?: string[];
          fast?: boolean;
          fastFreeOption?: "upgrade" | "pay";
          fastPriceNpr?: number;
          fastPaymentMode?: "wallet" | "khalti";
        };

        if (draft.title) setTitle(String(draft.title));
        if (draft.excerpt) setExcerpt(String(draft.excerpt));
        if (draft.categoryId) setCategoryId(String(draft.categoryId));
        if (draft.level && LEVELS.includes(draft.level)) setLevel(draft.level);
        if (Array.isArray(draft.tags)) setTags(draft.tags.map((t) => String(t)).filter(Boolean));
        if (typeof draft.fast === "boolean") setFast(Boolean(draft.fast));
        if (draft.fastFreeOption === "upgrade" || draft.fastFreeOption === "pay") {
          setFastFreeOption(draft.fastFreeOption);
        }
        if (Number.isFinite(Number(draft.fastPriceNpr))) {
          setFastPriceNpr(Math.max(MIN_FAST_RESPONSE_PRICE_NPR, Math.floor(Number(draft.fastPriceNpr))));
        }
        if (draft.fastPaymentMode === "wallet" || draft.fastPaymentMode === "khalti") {
          setFastPaymentMode(draft.fastPaymentMode);
        }
      }
    } catch {

    }

    const isCompleted = !statusRaw || statusRaw === "completed";
    if (!isCompleted) {
      const cancelled =
        statusRaw === "cancelled" || statusRaw === "canceled" || statusRaw.includes("cancel");
      showToast(
        cancelled
          ? "Khalti payment was cancelled."
          : `Khalti payment did not complete (${statusRaw}).`,
        "error",
        { durationMs: 3000 }
      );
      setFastKhaltiPidx("");
    } else if (pidx) {
      setFast(true);
      setFastFreeOption("pay");
      setFastPaymentMode("khalti");
      setFastKhaltiPidx(pidx);
      showToast("Khalti payment received. Click Post Question to finalize.", "success", {
        durationMs: 2500,
      });
    } else {
      showToast("Payment completed but reference was missing. Please pay again.", "error");
      setFastKhaltiPidx("");
    }

    const cleanUrl = new URL(window.location.href);
    ["pidx", "status", "transaction_id", "purchase_order_id", "purchase_order_name", "total_amount"].forEach(
      (key) => cleanUrl.searchParams.delete(key)
    );
    window.history.replaceState({}, document.title, `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
    sessionStorage.removeItem(ASK_DRAFT_KEY);
  }, [showToast]);

  useEffect(() => {
    if (!fast || isProUser || fastFreeOption !== "pay") return;
    let cancelled = false;
    const loadWallet = async () => {
      setWalletLoading(true);
      try {
        const data = await fetchWalletSummary();
        if (cancelled) return;
        setWalletBalance(Number(data.walletBalance || 0));
      } catch {
        if (cancelled) return;
      } finally {
        if (!cancelled) setWalletLoading(false);
      }
    };
    void loadWallet();
    return () => {
      cancelled = true;
    };
  }, [fast, isProUser, fastFreeOption]);

  const addTag = (value: string) => {
  const v = value.trim();
  if (!v) return;
  if (tags.includes(v)) return;
  if (tags.length >= 8) {
    showToast("Maximum 8 tags allowed", "error");
    return;
  }

  setTags((prev) => [...prev, v]);
};

const removeTag = (tag: string) => {
  setTags((prev) => prev.filter((t) => t !== tag));
};

const onTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addTag(tagInput);
    setTagInput("");
  }


  if (e.key === "Backspace" && !tagInput && tags.length) {
    setTags((prev) => prev.slice(0, prev.length - 1));
  }
};

  const initiateFastResponseKhaltiPayment = async () => {
    const amountNpr = Math.floor(Number(fastPriceNpr) || 0);
    if (amountNpr < MIN_FAST_RESPONSE_PRICE_NPR) {
      showToast(`Minimum fast response price is NPR ${MIN_FAST_RESPONSE_PRICE_NPR}`, "error");
      return;
    }

    if (!sessionUser?.id) {
      nav("/login");
      return;
    }

    setKhaltiLoading(true);
    try {
      sessionStorage.setItem(
        ASK_DRAFT_KEY,
        JSON.stringify({
          title,
          excerpt,
          categoryId,
          level,
          tags,
          fast,
          fastFreeOption,
          fastPriceNpr: amountNpr,
          fastPaymentMode,
        })
      );

      const purchaseOrderId = `fast-response-${sessionUser.id}-${Date.now()}`;
      const response = await axios.post<PaymentInitiateResponse>(
        `${API_BASE}/api/payment/khalti/initiate`,
        {
          amount: amountNpr * 100,
          returnUrl: `${window.location.origin}/questions/ask`,
          websiteUrl: window.location.origin,
          purchaseOrderId,
          purchaseOrderName: "Fast Response Question Reward",
          customerInfo: {
            name:
              [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(" ").trim() ||
              "GyanLearnia User",
            email: sessionUser.email,
          },
        },
        { withCredentials: true }
      );

      if (!response.data.success || !response.data.paymentInfo?.paymentUrl) {
        showToast(response.data.error || "Could not initiate Khalti payment", "error");
        setKhaltiLoading(false);
        return;
      }

      window.location.href = String(response.data.paymentInfo.paymentUrl);
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? String(error.response.data.error)
          : "Could not initiate Khalti payment";
      showToast(message, "error");
      setKhaltiLoading(false);
    }
  };


  const submit = async () => {
    setErr(null);

    if (title.trim().length < 10) {
      showToast("Title must be at least 10 characters.", "error");
      return;
    }
    if (excerpt.trim().length < 20) {
      showToast("Question details must be at least 20 characters.", "error");
      return;
    }
    if (!categoryId) {
      showToast("Please select a category.", "error");
      return;
    }
    if (!level) {
      showToast("Please select a level.", "error");
      return;
    }

    const payload: any = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      categoryId,
      level,
      tags,
      isFastResponse: fast,
    };

    if (fast) {
      if (isProUser) {
        payload.fastResponsePaymentMode = "pro";
      } else {
        if (fastFreeOption === "upgrade") {
          showToast("Upgrade to Pro for unlimited fast response questions.", "info", {
            durationMs: 2200,
          });
          nav("/pricing");
          return;
        }

        const amountNpr = Math.floor(Number(fastPriceNpr) || 0);
        if (amountNpr < MIN_FAST_RESPONSE_PRICE_NPR) {
          showToast(`Minimum fast response price is NPR ${MIN_FAST_RESPONSE_PRICE_NPR}`, "error");
          return;
        }

        payload.fastResponsePrice = amountNpr;
        payload.fastResponsePaymentMode = fastPaymentMode;

        if (fastPaymentMode === "khalti") {
          if (!fastKhaltiPidx) {
            showToast("Complete Khalti payment first, then post your question.", "error");
            return;
          }
          payload.fastResponseKhaltiPidx = fastKhaltiPidx;
        }
      }
    }

    setPosting(true);

    try {
      const res: any = await createQuestion(payload);

      const item = res?.item ?? res?.question ?? res?.data ?? res;
      const newId = item?.id ?? item?._id;

      showToast("Question posted successfully", "success");
      setFastKhaltiPidx("");

      if (newId) nav(`/questions/${newId}`);
      else nav("/questions");
    } catch (e: any) {
      const msg = e?.message || "Failed to create question";
      setErr(msg);
      showToast(msg, "error", { durationMs: 3500 });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-sm text-gray-600">
        <Link to="/questions" className="font-semibold text-indigo-700 hover:text-indigo-800">
          Questions
        </Link>{" "}
        <span className="text-gray-400">/</span>{" "}
        <span className="text-gray-700">Ask</span>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Ask a Question</h1>

        {err ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <div>
          <label className="text-xs font-medium text-gray-700">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., How to center a div in Tailwind?"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1 text-xs text-gray-500">Minimum 10 characters.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-700">Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as any)}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {categories.length ? (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              ) : (
                <option value="">Loading categories...</option>
              )}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700">Question Details</label>

          <div className="mt-2 rounded-l border border-gray-300 overflow-hidden quill-editor">
            <RichTextEditor
              value={excerpt}
              onChange={setExcerpt}
              placeholder="Explain Your Question Details here"
              className="bg-white"
            />
          </div>

          <p className="mt-1 text-xs text-gray-500">Minimum 20 characters.</p>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700">Tags</label>

          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100">
            
            {/* existing tags */}
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-indigo-500 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}


            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={onTagKeyDown}
              className="flex-1 min-w-[120px] border-none bg-transparent text-sm focus:outline-none"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={fast}
            onChange={(e) => {
              const checked = e.target.checked;
              setFast(checked);
              if (!checked) {
                setFastKhaltiPidx("");
                setFastFreeOption("upgrade");
                setFastPaymentMode("wallet");
              }
            }}
            className="h-4 w-4"
          />
          Request Fast Response
        </label>

        {fast ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            {isProUser ? (
              <p className="text-sm text-gray-700">
                You are on Pro plan. You can post fast response questions directly.
              </p>
            ) : (
              <div className="space-y-4">

                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="inline-flex items-center gap-2 text-gray-700">
                    <input
                      type="radio"
                      name="fast_free_option"
                      checked={fastFreeOption === "upgrade"}
                      onChange={() => setFastFreeOption("upgrade")}
                    />
                    Upgrade to Pro Plan
                  </label>
                  <label className="inline-flex items-center gap-2 text-gray-700">
                    <input
                      type="radio"
                      name="fast_free_option"
                      checked={fastFreeOption === "pay"}
                      onChange={() => setFastFreeOption("pay")}
                    />
                    Pay per question
                  </label>
                </div>

                {fastFreeOption === "upgrade" ? (
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-700">
                    Upgrade to Pro for unlimited fast response posting.
                    <button
                      type="button"
                      onClick={() => nav("/pricing")}
                      className="ml-2 font-semibold underline underline-offset-2"
                    >
                      Go to pricing
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Reward Price (NPR)</label>
                      <input
                        type="number"
                        min={MIN_FAST_RESPONSE_PRICE_NPR}
                        step={1}
                        value={fastPriceNpr}
                        onChange={(e) => {
                          setFastPriceNpr(Math.max(0, Number(e.target.value)));
                          if (fastKhaltiPidx) setFastKhaltiPidx("");
                        }}
                        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Minimum NPR {MIN_FAST_RESPONSE_PRICE_NPR}. This is the reward pool.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <label className="inline-flex items-center gap-2 text-gray-700">
                        <input
                          type="radio"
                          name="fast_payment_mode"
                          checked={fastPaymentMode === "wallet"}
                          onChange={() => {
                            setFastPaymentMode("wallet");
                            setFastKhaltiPidx("");
                          }}
                        />
                        Wallet payment
                      </label>
                      <label className="inline-flex items-center gap-2 text-gray-700">
                        <input
                          type="radio"
                          name="fast_payment_mode"
                          checked={fastPaymentMode === "khalti"}
                          onChange={() => {
                            setFastPaymentMode("khalti");
                            setFastKhaltiPidx("");
                          }}
                        />
                        Direct Khalti payment
                      </label>
                    </div>

                    {fastPaymentMode === "wallet" ? (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                        Wallet Balance: {walletLoading ? "Loading..." : `NPR ${walletBalance.toFixed(2)}`}
                        <Link to="/wallet" className="ml-2 font-semibold underline underline-offset-2">
                          Load wallet
                        </Link>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-800">
                        {fastKhaltiPidx ? (
                          <p>
                            Khalti payment reference added. You can now post the question.
                            <span className="ml-2 font-mono text-xs">{fastKhaltiPidx}</span>
                          </p>
                        ) : (
                          <p>Complete Khalti payment first, then click Post Question.</p>
                        )}
                        <button
                          type="button"
                          onClick={() => void initiateFastResponseKhaltiPayment()}
                          disabled={khaltiLoading}
                          className={`mt-3 inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold text-white ${
                            khaltiLoading ? "cursor-not-allowed bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
                          }`}
                        >
                          {khaltiLoading ? "Redirecting..." : "Pay with Khalti"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Link
            to="/questions"
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={submit}
            disabled={posting}
            className={[
              "rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition",
              posting ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700",
            ].join(" ")}
          >
            {posting ? "Posting..." : "Post Question"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default AskQuestionPage;
