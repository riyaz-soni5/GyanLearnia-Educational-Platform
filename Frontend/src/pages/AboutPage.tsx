// src/pages/AboutPage.tsx
import { Link } from "react-router-dom";

const Icon = {
  Book: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 0-2 2V4z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M6 18h12"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6 4a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2"
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
  Chat: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8 12h8M8 9h5M8 15h6"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Users: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M16 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zM6 13a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
        className="stroke-current"
        strokeWidth="1.8"
      />
      <path
        d="M2 22a6 6 0 0 1 12 0M12 22a6 6 0 0 1 10 0"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Target: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2a10 10 0 1 0 10 10"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 6a6 6 0 1 0 6 6"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 10a2 2 0 1 0 2 2"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M22 2l-7 7"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Graduation: (props: React.SVGProps<SVGSVGElement>) => (
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
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl bg-gray-50 p-6">
    <p className="text-xs font-medium text-gray-600">{label}</p>
    <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
  </div>
);

const ValueCard = ({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
      {icon}
    </div>
    <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
    <p className="mt-2 text-sm text-gray-600">{desc}</p>
  </div>
);

const AboutPage = () => {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="rounded-2xl bg-white p-10 shadow-sm">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              About <span className="text-indigo-600">GyanLearnia</span>
            </h1>
            <p className="mt-4 text-sm text-gray-600">
              GyanLearnia is a Final Year Project built to support learners across Nepal with
              curriculum-aligned courses, Q&amp;A, and mentor discovery — in a single platform.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/courses"
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Explore Courses
              </Link>
              <Link
                to="/questions"
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Ask a Question
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Stat label="Learners" value="12K+" />
              <Stat label="Questions" value="48K+" />
              <Stat label="Mentors" value="320+" />
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-gray-900 p-8 text-white">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
                  <span className="text-sm font-bold">GL</span>
                </div>
                <div>
                  <p className="text-lg font-semibold">Academic + Skill Learning</p>
                  <p className="text-xs text-gray-300">A simple, exam-friendly platform</p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {[
                  "SEE & +2 focused learning support",
                  "Verified instructor + topper mentors",
                  "Clean UI for academic usability",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />
                    <p className="text-sm text-gray-200">{t}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-xl bg-white/5 p-4">
                <p className="text-xs text-gray-300">
                  Note: This is a demo UI for a Final Year Project. Backend and payments can be connected later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="grid gap-6 lg:grid-cols-3">
        <ValueCard
          icon={<Icon.Target className="h-5 w-5" />}
          title="Our Mission"
          desc="Make quality learning and academic support accessible for students across Nepal, from SEE to +2 and beyond."
        />
        <ValueCard
          icon={<Icon.Book className="h-5 w-5" />}
          title="What We Provide"
          desc="Courses, structured notes, question-answer support, and mentor discovery — designed for exam readiness."
        />
        <ValueCard
          icon={<Icon.Shield className="h-5 w-5" />}
          title="Trust & Verification"
          desc="Instructor verification and community feedback help learners find reliable answers and mentors."
        />
      </section>

      {/* How it works */}
      <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">How it works</h2>
        <p className="mt-2 text-sm text-gray-600">
          A simple flow that matches real learning habits: learn → ask → verify → improve.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-gray-50 p-6">
            <div className="flex items-center gap-2 text-gray-900">
              <Icon.Graduation className="h-5 w-5" />
              <p className="text-sm font-semibold">1) Learn</p>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Explore courses and notes aligned with SEE and +2 syllabus topics.
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-6">
            <div className="flex items-center gap-2 text-gray-900">
              <Icon.Chat className="h-5 w-5" />
              <p className="text-sm font-semibold">2) Ask</p>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Ask questions in Q&amp;A — get answers, votes, and verified explanations.
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-6">
            <div className="flex items-center gap-2 text-gray-900">
              <Icon.Users className="h-5 w-5" />
              <p className="text-sm font-semibold">3) Connect</p>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Discover mentors (verified instructors or top-ranked students) and follow their feed.
            </p>
          </div>
        </div>
      </section>

      {/* Team (simple) */}
      <section className="rounded-2xl bg-white p-10 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Project Team</h2>
        <p className="mt-2 text-sm text-gray-600">
          This section is kept simple for Final Year Project documentation. You can replace names later.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Project Lead", role: "Frontend + UI" },
            { name: "Backend Developer", role: "API + Database" },
            { name: "Documentation", role: "Reports + Diagrams" },
          ].map((m) => (
            <div
              key={m.name}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gray-900 text-white grid place-items-center text-sm font-bold">
                  GL
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-600">{m.role}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Responsible for building and improving the GyanLearnia platform.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-gray-900 p-10 text-center text-white">
        <h2 className="text-2xl font-bold">Ready to start learning?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-gray-300">
          Join GyanLearnia to explore courses, ask questions, and connect with mentors.
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
            Browse Courses
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
