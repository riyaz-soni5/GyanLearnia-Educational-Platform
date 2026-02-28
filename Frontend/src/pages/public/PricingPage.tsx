import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import { getUser } from "@/services/session";

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
      "Basic mentor discovery",
      "Build your learner profile",
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
      "Priority academic support",
      "Mentor request and private chat",
      "More verified-answer visibility",
      "Premium learning experience",
    ],
    ctaText: "Get GyanLearnia Pro",
    ctaTo: "/register",
  },
];

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
  const user = getUser();
  const isLoggedIn = Boolean(user?.id);

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
                Choose the plan that fits your learning journey. Start anytime, upgrade to
                GyanLearnia Pro extra features.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <section className="grid gap-6 lg:grid-cols-2">
        {plans.map((plan, idx) => {
          const isCurrentPlan = isLoggedIn && plan.name === "Free";

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
            <p className="mx-auto mt-4 max-w-2xl text-sm text-indigo-50/95 sm:text-base">
              Build your profile, join the learning community, and unlock Pro support whenever you
              need it.
            </p>
          </div>
        </section>
      </Reveal>
    </div>
  );
};

export default PricingPage;
