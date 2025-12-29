import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

type BarDatum = { label: string; value: number };

const MiniBarChart = ({ data }: { data: BarDatum[] }) => {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Weekly Learning Activity
          </h3>
          <p className="mt-1 text-xs text-gray-600">
            Sample preview (static for now)
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          This Week
        </span>
      </div>

      <div className="mt-6">
        <svg viewBox="0 0 400 140" className="h-36 w-full">
          {/* baseline */}
          <line x1="20" y1="120" x2="390" y2="120" className="stroke-gray-200" />
          {data.map((d, i) => {
            const barW = 40;
            const gap = 18;
            const x = 30 + i * (barW + gap);
            const h = Math.round((d.value / max) * 90);
            const y = 120 - h;

            return (
              <g key={d.label}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx="10"
                  className="fill-indigo-600/90"
                />
                <text
                  x={x + barW / 2}
                  y={135}
                  textAnchor="middle"
                  className="fill-gray-500 text-[10px]"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const HomePage = () => {
  // You can later replace these with real API values
  const learnersTarget = 12500;
  const questionsTarget = 48000;
  const tutorsTarget = 320;
  const certificatesTarget = 8900;

  const learners = useCountUp(learnersTarget);
  const questions = useCountUp(questionsTarget);
  const tutors = useCountUp(tutorsTarget);
  const certificates = useCountUp(certificatesTarget);

  const chartData = useMemo<BarDatum[]>(
    () => [
      { label: "Mon", value: 40 },
      { label: "Tue", value: 55 },
      { label: "Wed", value: 68 },
      { label: "Thu", value: 52 },
      { label: "Fri", value: 80 },
      { label: "Sat", value: 62 },
      { label: "Sun", value: 45 },
    ],
    []
  );

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="rounded-2xl bg-white p-10 shadow-sm">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
              Learn Smarter with
              <span className="text-indigo-600"> GyanLearnia</span>
            </h1>
            <p className="mt-4 text-gray-600">
              Curriculum-aligned learning, verified answers, skill-based courses,
              and certification — built for learners across Nepal.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/courses"
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Explore Courses
              </Link>
              <Link
                to="/questions"
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Ask a Question
              </Link>
            </div>
          </div>

          {/* Banner placeholder */}
          <div className="hidden md:block">
            <div className="flex h-64 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <span className="text-sm font-medium">
                Hero Illustration / Banner
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats + Graphical */}
      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Learning Impact (Preview)
            </h2>
            <p className="text-sm text-gray-600">
              These are sample counters for your static UI — connect to backend
              later.
            </p>
          </div>

          <Link
            to="/register"
            className="inline-flex w-fit items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Join Now
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Counters */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-5">
                <p className="text-xs font-medium text-gray-600">Learners</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {learners.toLocaleString()}+
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Students & self-learners using the platform.
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-5">
                <p className="text-xs font-medium text-gray-600">Questions Answered</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {questions.toLocaleString()}+
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Verified and community-upvoted answers.
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-5">
                <p className="text-xs font-medium text-gray-600">Verified Tutors</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {tutors.toLocaleString()}+
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Instructors available for guidance.
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-5">
                <p className="text-xs font-medium text-gray-600">Certificates Issued</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {certificates.toLocaleString()}+
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Skill-based certification after completion.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Key Highlights
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Q&A + Courses + Tutor discovery — one ecosystem.
                  </p>
                </div>

                <div className="flex gap-2">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                    Curriculum aligned
                  </span>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    Verified support
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Graph */}
          <MiniBarChart data={chartData} />
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900">Why GyanLearnia?</h2>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Verified Answers",
              desc: "Reliable, teacher-verified and upvoted academic answers.",
            },
            {
              title: "Skill-Based Courses",
              desc: "Academic, technical, and vocational learning with structure.",
            },
            {
              title: "Certification",
              desc: "Digital certificates after course completion.",
            },
            {
              title: "Fast Response",
              desc: "Request priority academic support when time matters.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-gray-900 p-10 text-center text-white">
        <h2 className="text-2xl font-bold">Start Learning Today</h2>
        <p className="mx-auto mt-3 max-w-xl text-gray-300">
          Join a growing learning ecosystem designed for Nepal’s academic and
          skill-development needs.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/register"
            className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100"
          >
            Create Free Account
          </Link>
          <Link
            to="/courses"
            className="rounded-lg border border-gray-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Browse Courses
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
