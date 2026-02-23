import { Link } from "react-router-dom";

const Icon = {
  Check: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20 6L9 17l-5-5"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Spark: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2l1.2 5.2L18 9l-4.8 1.8L12 16l-1.2-5.2L6 9l4.8-1.8L12 2z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M19 14l.7 3 2.3.8-2.3.8-.7 3-.7-3-2.3-.8 2.3-.8.7-3z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Shield: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-5"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Bolt: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Tutor: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 7l8-4 8 4-8 4-8-4z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M6 10v6c0 2 4 4 6 4s6-2 6-4v-6"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M4 7v6"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Certificate: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7 3h10v12H7V3z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 7h6M9 10h6"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 15l-2 6 4-2 4 2-2-6"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Question: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-.8.7-1.2 1-1.2 2.2"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 17h.01"
        className="stroke-current"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  ),
};

const FeatureItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-2">
    <span className="mt-0.5 text-green-700">
      <Icon.Check className="h-4 w-4" />
    </span>
    <p className="text-sm text-gray-700">{text}</p>
  </div>
);

const PricingCard = ({
  title,
  subtitle,
  price,
  tag,
  tone,
  features,
  ctaText,
  ctaTo,
  highlighted,
  icon,
}: {
  title: string;
  subtitle: string;
  price: string;
  tag: string;
  tone: "gray" | "indigo" | "green";
  features: string[];
  ctaText: string;
  ctaTo: string;
  highlighted?: boolean;
  icon: React.ReactNode;
}) => {
  const toneCls =
    tone === "indigo"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
      : tone === "green"
      ? "bg-green-50 text-green-700 ring-green-200"
      : "bg-gray-50 text-gray-700 ring-gray-200";

  return (
    <div
      className={[
        "rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md",
        highlighted ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-200",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
              {icon}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
            </div>
          </div>
        </div>

        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${toneCls}`}>
          {tag}
        </span>
      </div>

      <div className="mt-6">
        <p className="text-sm text-gray-600">Price</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">{price}</p>
        <p className="mt-2 text-xs text-gray-500">
          *Pricing is sample for FYP UI. Connect payment later.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {features.map((f) => (
          <FeatureItem key={f} text={f} />
        ))}
      </div>

      <Link
        to={ctaTo}
        className={[
          "mt-7 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition",
          highlighted
            ? "bg-indigo-600 text-white hover:bg-indigo-700"
            : "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
        ].join(" ")}
      >
        {ctaText}
      </Link>
    </div>
  );
};

const PricingPage = () => {
  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="rounded-2xl bg-white p-10 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Pricing for Students & Mentors
            </h1>
            <p className="mt-3 text-sm text-gray-600">
              Simple, academic-friendly plans for Nepal. Start free, upgrade when you need faster answers,
              mentorship, and certificates.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                <Icon.Shield className="h-4 w-4" /> Verified Support
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700 ring-1 ring-yellow-200">
                <Icon.Bolt className="h-4 w-4" /> Fast Response
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                <Icon.Certificate className="h-4 w-4" /> Certificates
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/courses"
              className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Browse Courses
            </Link>
            <Link
              to="/questions"
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Go to Q&amp;A
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="grid gap-6 lg:grid-cols-3">
        <PricingCard
          title="Free"
          subtitle="Best for exploring the platform"
          price="NPR 0"
          tag="Starter"
          tone="gray"
          icon={<Icon.Question className="h-5 w-5" />}
          features={[
            "Browse courses (free content)",
            "Ask questions in Q&A (community answers)",
            "Basic mentor discovery",
            "Bookmark & save posts (static for now)",
          ]}
          ctaText="Create free account"
          ctaTo="/register"
        />

        <PricingCard
          title="Pro Mentor"
          subtitle="For mentorship + premium learning"
          price="NPR 499 / month"
          tag="Premium"
          tone="green"
          icon={<Icon.Tutor className="h-5 w-5" />}
          features={[
            "Mentor chat & feed access (premium)",
            "Fast Response tokens (more)",
            "Verified instructor answers (more)",
            "Premium certificates",
            "Mentor session requests (demo)",
          ]}
          ctaText="Go Pro"
          ctaTo="/register"
        />
      </section>

      {/* Comparison / highlights */}
      <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">What’s included</h2>
        <p className="mt-2 text-sm text-gray-600">
          This is a simple preview for your FYP. You can later connect payments and real entitlements from backend.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-gray-50 p-6">
            <div className="flex items-center gap-2 text-gray-900">
              <Icon.Question className="h-5 w-5" />
              <p className="text-sm font-semibold">Q&amp;A Support</p>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Ask academic questions and get community + verified responses depending on plan.
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-6">
            <div className="flex items-center gap-2 text-gray-900">
              <Icon.Shield className="h-5 w-5" />
              <p className="text-sm font-semibold">Verified Mentors</p>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Access verified instructors and top-ranked student mentors for guidance.
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-6">
            <div className="flex items-center gap-2 text-gray-900">
              <Icon.Certificate className="h-5 w-5" />
              <p className="text-sm font-semibold">Certificates</p>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Certificates are unlocked after course completion (plan-based).
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-gray-900 p-10 text-center text-white">
        <h2 className="text-2xl font-bold">Start with Free, Upgrade Anytime</h2>
        <p className="mx-auto mt-3 max-w-2xl text-gray-300">
          Build your learning profile, ask questions, and access mentors when you need them.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/register"
            className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-100"
          >
            Create Account
          </Link>
          <Link
            to="/courses"
            className="rounded-lg border border-gray-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Explore Courses
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
