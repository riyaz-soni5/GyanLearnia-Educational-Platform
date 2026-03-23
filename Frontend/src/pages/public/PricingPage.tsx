import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import axios from "axios";
import { useToast } from "@/components/toast";
import { getUser, setUser } from "@/services/session";
import { fetchCurrentUserProfile } from "@/services/userProfile";

type Plan = {
  name: string;
  subtitle: string;
  price: string;
  cycle: string;
  badge: string;
  highlighted?: boolean;
  features: string[];
  ctaText: string;
  ctaTo: string;
};

const plans: Plan[] = [
  {
    name: "Free",
    subtitle: "Start learning and explore the platform.",
    price: "Rs 0",
    cycle: "",
    badge: "Starter",
    features: [
      "Browse published courses",
      "Ask and answer in community Q&A",
      "Build your learner profile",
      "Pay for Fast Support"
    ],
    ctaText: "Start Free",
    ctaTo: "/register",
  },
  {
    name: "GyanLearnia Pro",
    subtitle: "For faster support and premium mentor access.",
    price: "Rs 499",
    cycle: "per month",
    badge: "Most Popular",
    highlighted: true,
    features: [
      "Pro Profile Badge and Recognition",
      "Ultimate Mentor request and private chat",
      "Ultimate Fast Support access",
      "Get Free Courses Montly",
    ],
    ctaText: "Get GyanLearnia Pro",
    ctaTo: "/register",
  },
];

type KhaltiApiSuccess = {
  success: true;
  message: string;
  paymentInfo: {
    paymentUrl?: string;
    pidx?: string;
    status?: string;
    [key: string]: unknown;
  };
};

type KhaltiApiFailure = {
  success: false;
  error: string;
};

type KhaltiApiResponse = KhaltiApiSuccess | KhaltiApiFailure;
type CurrentPlan = "Free" | "Pro";

function useInViewOnce<T extends HTMLElement>(threshold = 0.16) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current || inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [inView, threshold]);

  return { ref, inView };
}

const Reveal = ({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) => {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`${className} transform-gpu transition-all duration-700 ease-out will-change-transform ${
        inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const PricingPage = () => {
  const { showToast } = useToast();
  const [sessionUser, setSessionUserState] = useState(getUser());
  const isLoggedIn = Boolean(sessionUser?.id);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan>(
    sessionUser?.currentPlan === "Pro" ? "Pro" : "Free"
  );

  useEffect(() => {
    const syncSession = () => {
      const next = getUser();
      setSessionUserState(next);
      setCurrentPlan(next?.currentPlan === "Pro" ? "Pro" : "Free");
    };

    window.addEventListener("gyanlearnia_user_updated", syncSession);
    return () => window.removeEventListener("gyanlearnia_user_updated", syncSession);
  }, []);

  useEffect(() => {
    if (!sessionUser?.id) {
      setCurrentPlan("Free");
      return;
    }

    let cancelled = false;
    const syncPlanFromProfile = async () => {
      try {
        const profile = await fetchCurrentUserProfile();
        if (cancelled) return;

        const nextPlan: CurrentPlan = profile.currentPlan === "Pro" ? "Pro" : "Free";
        setCurrentPlan(nextPlan);

        const persistedInLocal = Boolean(localStorage.getItem("gyanlearnia_user"));
        setUser(
          {
            id: profile.id,
            role: profile.role,
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            avatarUrl: profile.avatarUrl ?? null,
            isVerified: profile.isVerified,
            verificationStatus: profile.verificationStatus,
            currentPlan: nextPlan,
            planStatus: profile.planStatus ?? "Active",
            planActivatedAt: profile.planActivatedAt ?? null,
            planExpiresAt: profile.planExpiresAt ?? null,
          },
          persistedInLocal
        );
      } catch {
        // leave the current plan as it is if sync fails
      }
    };

    void syncPlanFromProfile();
    return () => {
      cancelled = true;
    };
  }, [sessionUser?.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pidx = String(params.get("pidx") || "").trim();
    if (!pidx) return;

    let cancelled = false;

    const verifyPayment = async () => {
      setPaymentLoading(true);

      try {
        const response = await axios.post<KhaltiApiResponse>(
          `${API_BASE}/api/payment/khalti/verify`,
          { pidx },
          { withCredentials: true }
        );

        if (cancelled) return;

        if (response.data.success) {
          showToast("Payment successful. Your plan is now Pro.", "success");
          setCurrentPlan("Pro");

          try {
            const profile = await fetchCurrentUserProfile();
            if (!cancelled) {
              const persistedInLocal = Boolean(localStorage.getItem("gyanlearnia_user"));
              setUser(
                {
                  id: profile.id,
                  role: profile.role,
                  email: profile.email,
                  firstName: profile.firstName,
                  lastName: profile.lastName,
                  avatarUrl: profile.avatarUrl ?? null,
                  isVerified: profile.isVerified,
                  verificationStatus: profile.verificationStatus,
                  currentPlan: profile.currentPlan === "Pro" ? "Pro" : "Free",
                  planStatus: profile.planStatus ?? "Active",
                  planActivatedAt: profile.planActivatedAt ?? null,
                  planExpiresAt: profile.planExpiresAt ?? null,
                },
                persistedInLocal
              );
            }
          } catch {
            // payment already went through, so we can skip the session refresh
          }
        } else {
          showToast(response.data.error || "Payment verification failed.", "error", {
            durationMs: 3000,
          });
        }
      } catch (error: unknown) {
        if (cancelled) return;
        const message =
          axios.isAxiosError(error) && error.response?.data?.error
            ? String(error.response.data.error)
            : "Could not verify payment. Please try again.";
        showToast(message, "error", { durationMs: 3000 });
      } finally {
        if (!cancelled) setPaymentLoading(false);
      }

      const cleanUrl = new URL(window.location.href);
      const khaltiParams = [
        "pidx",
        "status",
        "transaction_id",
        "purchase_order_id",
        "purchase_order_name",
        "total_amount",
      ];

      for (const key of khaltiParams) {
        cleanUrl.searchParams.delete(key);
      }

      window.history.replaceState(
        {},
        document.title,
        `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`
      );
    };

    void verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [API_BASE, showToast]);

  const handleKhaltiPayment = async () => {
    if (!sessionUser?.id) return;
    if (currentPlan === "Pro") {
      showToast("You are already on the Pro plan.", "info");
      return;
    }

    const customerName =
      [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(" ").trim() || "GyanLearnia User";
    const purchaseOrderId = `pro-${sessionUser.id}-${Date.now()}`;

    setPaymentLoading(true);

    try {
      const response = await axios.post<KhaltiApiResponse>(
        `${API_BASE}/api/payment/khalti/initiate`,
        {
          amount: 49900,
          returnUrl: `${window.location.origin}/pricing`,
          websiteUrl: window.location.origin,
          purchaseOrderId,
          purchaseOrderName: "GyanLearnia Pro Monthly",
          customerInfo: {
            name: customerName,
            email: sessionUser.email,
          },
        },
        { withCredentials: true }
      );

      if (!response.data.success) {
        showToast(response.data.error || "Could not initiate payment.", "error", {
          durationMs: 3000,
        });
        setPaymentLoading(false);
        return;
      }

      const paymentUrl = String(response.data.paymentInfo?.paymentUrl || "");
      if (!paymentUrl) {
        showToast("Payment URL was not returned.", "error", { durationMs: 3000 });
        setPaymentLoading(false);
        return;
      }

      window.location.href = paymentUrl;
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? String(error.response.data.error)
          : "Failed to initiate payment.";
      showToast(message, "error", { durationMs: 3000 });
      setPaymentLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4">
      <Reveal>
        <section className="relative overflow-hidden rounded-2xl border border-base bg-surface p-8 sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full blur-2xl" />

          <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                Pricing
              </p>
              <h1 className="mt-3 text-4xl font-bold leading-tight text-basec sm:text-5xl">
                Upgrade your plan
              </h1>
              <p className="mt-4 max-w-3xl text-sm text-muted sm:text-base">
                Choose the plan that fits your learning journey.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <section className="grid gap-6 lg:grid-cols-2">
        {plans.map((plan, idx) => {
          const isCurrentPlan =
            isLoggedIn &&
            ((plan.name === "Free" && currentPlan === "Free") ||
              (plan.name === "GyanLearnia Pro" && currentPlan === "Pro"));

          return (
            <Reveal key={plan.name} delay={idx * 120}>
              <article
                className={`rounded-2xl border p-6 shadow-sm transition ${
                  plan.highlighted
                    ? "border-indigo-300 bg-surface ring-2 ring-indigo-100"
                    : "border-base bg-surface"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-basec">{plan.name}</h2>
                    <p className="mt-1 text-sm text-muted">{plan.subtitle}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                      plan.highlighted
                        ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                        : "bg-gray-50 text-gray-700 ring-gray-200"
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>

                <div className="mt-6">
                  <p className="text-4xl font-black text-basec">{plan.price}</p>
                  <p className="mt-1 text-sm text-muted">{plan.cycle}</p>
                </div>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <p className="text-sm text-basec">{feature}</p>
                    </div>
                  ))}
                </div>

                {isCurrentPlan ? (
                  <div className="mt-8 inline-flex w-full items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                    Your Current Plan
                  </div>
                ) : plan.name === "GyanLearnia Pro" && isLoggedIn ? (
                  <button
                    type="button"
                    onClick={handleKhaltiPayment}
                    disabled={paymentLoading}
                    className={[
                      "mt-8 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition",
                      paymentLoading ? "cursor-not-allowed bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700",
                    ].join(" ")}
                  >
                    {paymentLoading ? "Redirecting to Khalti..." : "Pay Rs 499 & Upgrade"}
                  </button>
                ) : plan.name === "Free" && isLoggedIn ? (
                  <div className="mt-8 inline-flex w-full items-center justify-center rounded-lg border border-base bg-[rgb(var(--bg))] px-4 py-2.5 text-sm font-semibold text-basec">
                    Free Plan
                  </div>
                ) : (
                  <Link
                    to={plan.ctaTo}
                    className={`mt-8 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                      plan.highlighted
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "border border-base bg-surface text-basec hover:bg-[rgb(var(--bg))]"
                    }`}
                  >
                    {plan.ctaText}
                  </Link>
                )}
              </article>
            </Reveal>
          );
        })}
      </section>

      <Reveal delay={120}>
        <section className="relative overflow-hidden rounded-2xl border border-indigo-300/50 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 p-10 text-center text-white shadow-sm">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),rgba(255,255,255,0)_58%)]" />
          <div className="relative">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Start Free. Upgrade to Pro at Rs 499/month.
            </h2>
          </div>
        </section>
      </Reveal>
    </div>
  );
};

export default PricingPage;
