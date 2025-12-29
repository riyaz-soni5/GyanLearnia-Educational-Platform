// src/pages/QuestionDetailsPage.tsx
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Question } from "../app/types/question.types";

type Answer = {
  id: string;
  author: string;
  authorType?: "Student" | "Instructor" | "Tutor";
  createdAt: string;
  content: string;
  votes: number;
  isVerified?: boolean;
};

const Icon = {
  Up: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 4l7 8h-4v8H9v-8H5l7-8z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Down: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 20l-7-8h4V4h6v8h4l-7 8z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
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
  Eye: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        className="stroke-current"
        strokeWidth="1.8"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
        className="stroke-current"
        strokeWidth="1.8"
      />
    </svg>
  ),
  Clock: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10z"
        className="stroke-current"
        strokeWidth="1.8"
      />
      <path
        d="M12 6v6l4 2"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
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
    </svg>
  ),
};

const Badge = ({
  text,
  tone,
}: {
  text: string;
  tone: "green" | "yellow" | "indigo" | "gray";
}) => {
  const cls =
    tone === "green"
      ? "bg-green-50 text-green-700 ring-green-200"
      : tone === "yellow"
      ? "bg-yellow-50 text-yellow-700 ring-yellow-200"
      : tone === "indigo"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
      : "bg-gray-50 text-gray-700 ring-gray-200";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cls}`}>
      {text}
    </span>
  );
};

const VoteBox = ({
  value,
  onUp,
  onDown,
}: {
  value: number;
  onUp: () => void;
  onDown: () => void;
}) => (
  <div className="flex flex-col items-center gap-2">
    <button
      type="button"
      onClick={onUp}
      className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
      title="Upvote (static)"
    >
      <Icon.Up className="h-5 w-5" />
    </button>

    <p className="text-sm font-bold text-gray-900">{value}</p>

    <button
      type="button"
      onClick={onDown}
      className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
      title="Downvote (static)"
    >
      <Icon.Down className="h-5 w-5" />
    </button>
  </div>
);

const QuestionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();

  // ✅ Static/mock question dataset (replace with API later)
  const questions: Question[] = [
    {
      id: "q1",
      title: "How to solve quadratic equations using factorization?",
      excerpt:
        "I’m confused about selecting factors that add up to the middle term. Can someone show step-by-step for SEE-level?",
      subject: "Mathematics",
      level: "Class 10 (SEE)",
      tags: ["SEE", "Math", "Exam"],
      author: "Student A",
      authorType: "Student",
      answersCount: 4,
      views: 980,
      votes: 23,
      status: "Answered",
      createdAt: "2 days ago",
      hasVerifiedAnswer: true,
    },
    {
      id: "q2",
      title: "Explain Kirchhoff’s Laws with a numerical example",
      excerpt:
        "Need a clear explanation with one solved numerical for +2 Physics. Also how to apply sign convention properly?",
      subject: "Physics",
      level: "+2",
      tags: ["+2", "Physics", "Exam"],
      author: "Learner B",
      authorType: "Student",
      answersCount: 2,
      views: 620,
      votes: 12,
      status: "Answered",
      createdAt: "1 day ago",
    },
  ];

  const question = useMemo(() => questions.find((q) => q.id === id), [questions, id]);

  // ✅ Static answers
  const [answers, setAnswers] = useState<Answer[]>(
    question?.id === "q1"
      ? [
          {
            id: "a1",
            author: "Verified Teacher",
            authorType: "Instructor",
            createdAt: "1 day ago",
            votes: 18,
            isVerified: true,
            content:
              "For SEE level factorization: 1) Write ax² + bx + c. 2) Find two numbers p and q such that p×q = a×c and p+q = b. 3) Split the middle term bx into px + qx. 4) Factor by grouping.\n\nExample: x² + 5x + 6.\nHere a=1, c=6 → a×c=6. Two numbers that multiply to 6 and add to 5 are 2 and 3.\nSo x²+2x+3x+6 = x(x+2)+3(x+2) = (x+3)(x+2).",
          },
          {
            id: "a2",
            author: "Topper Mentor",
            authorType: "Student",
            createdAt: "20 hours ago",
            votes: 7,
            content:
              "Quick trick: write factors of c and check which pair adds to b. For negatives: if c is negative, one factor will be negative.\nAlso check: if a ≠ 1, use ac method (same steps but multiply a×c first).",
          },
        ]
      : [
          {
            id: "a3",
            author: "Tutor D",
            authorType: "Tutor",
            createdAt: "12 hours ago",
            votes: 6,
            content:
              "Kirchhoff’s laws:\nKCL: sum of currents entering a node = sum leaving.\nKVL: sum of voltages around any loop = 0.\nPick a loop direction and keep sign convention consistent (+ for rise, - for drop).",
          },
        ]
  );

  const [qVotes, setQVotes] = useState<number>(question?.votes ?? 0);
  const [draft, setDraft] = useState("");

  const [sort, setSort] = useState<"Top" | "Newest">("Top");

  const sortedAnswers = useMemo(() => {
    const list = [...answers];
    if (sort === "Top") list.sort((a, b) => b.votes - a.votes);
    if (sort === "Newest") list.reverse(); // static approximation
    // verified answer first
    list.sort((a, b) => Number(Boolean(b.isVerified)) - Number(Boolean(a.isVerified)));
    return list;
  }, [answers, sort]);

  if (!question) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="text-lg font-semibold text-gray-900">Question not found</p>
        <p className="mt-2 text-sm text-gray-600">
          The question you are trying to open doesn’t exist (static demo).
        </p>
        <Link
          to="/questions"
          className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Back to Questions
        </Link>
      </div>
    );
  }

  const answered = question.status === "Answered";

  const addAnswer = () => {
    if (draft.trim().length < 10) return;
    setAnswers((prev) => [
      {
        id: `a_${Date.now()}`,
        author: "You",
        authorType: "Student",
        createdAt: "Just now",
        votes: 0,
        content: draft.trim(),
      },
      ...prev,
    ]);
    setDraft("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Main content */}
      <div className="lg:col-span-8 space-y-6">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-600">
          <Link to="/questions" className="font-semibold text-indigo-700 hover:text-indigo-800">
            Questions
          </Link>{" "}
          <span className="text-gray-400">/</span> <span className="text-gray-700">Details</span>
        </div>

        {/* Question Card */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-5">
            {/* Vote */}
            <VoteBox
              value={qVotes}
              onUp={() => setQVotes((v) => v + 1)}
              onDown={() => setQVotes((v) => Math.max(0, v - 1))}
            />

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {question.hasVerifiedAnswer ? <Badge text="Verified Answer" tone="indigo" /> : null}
                {question.isFastResponse ? <Badge text="Fast Response" tone="yellow" /> : null}
                <Badge text={question.level} tone="gray" />
                <Badge text={question.subject} tone="gray" />

                <span
                  className={`ml-auto inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                    answered ? "bg-green-50 text-green-700 ring-green-200" : "bg-yellow-50 text-yellow-700 ring-yellow-200"
                  }`}
                >
                  {question.status}
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-bold text-gray-900">{question.title}</h1>

              <p className="mt-3 text-sm text-gray-700 whitespace-pre-line">{question.excerpt}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {question.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <Icon.Eye className="h-4 w-4" />
                  {question.views} views
                </span>
                <span className="inline-flex items-center gap-2">
                  <Icon.Clock className="h-4 w-4" />
                  asked {question.createdAt}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                  {question.author} ({question.authorType ?? "Student"})
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Answers header */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Answers ({answers.length})
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Best answers appear first. Verified answers are highlighted.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Sort</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "Top" | "Newest")}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="Top">Top</option>
                <option value="Newest">Newest</option>
              </select>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {sortedAnswers.map((a) => (
              <article
                key={a.id}
                className={[
                  "rounded-2xl border p-5",
                  a.isVerified ? "border-indigo-300 bg-indigo-50/40" : "border-gray-200 bg-white",
                ].join(" ")}
              >
                <div className="flex items-start gap-4">
                  <VoteBox
                    value={a.votes}
                    onUp={() =>
                      setAnswers((prev) =>
                        prev.map((x) => (x.id === a.id ? { ...x, votes: x.votes + 1 } : x))
                      )
                    }
                    onDown={() =>
                      setAnswers((prev) =>
                        prev.map((x) =>
                          x.id === a.id ? { ...x, votes: Math.max(0, x.votes - 1) } : x
                        )
                      )
                    }
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {a.isVerified ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                          <Icon.Check className="h-4 w-4" />
                          Verified Answer
                        </span>
                      ) : null}

                      <span className="ml-auto text-xs text-gray-500">{a.createdAt}</span>
                    </div>

                    <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{a.content}</p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm text-gray-600">
                        Answered by{" "}
                        <span className="font-semibold text-gray-900">{a.author}</span>{" "}
                        <span className="text-xs text-gray-500">({a.authorType ?? "Student"})</span>
                      </div>

                      <button
                        type="button"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        onClick={() => alert("Static UI: report feature later")}
                      >
                        Report
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Add answer */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-900">
            <Icon.Chat className="h-5 w-5" />
            <h3 className="text-lg font-bold">Write your answer</h3>
          </div>

          <p className="mt-2 text-sm text-gray-600">
            Keep it clear and exam-friendly. Use steps and examples when possible.
          </p>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            placeholder="Type your answer (static). Example: Step 1..., Step 2..."
            className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              Minimum 10 characters (static validation).
            </p>
            <button
              type="button"
              onClick={addAnswer}
              disabled={draft.trim().length < 10}
              className={[
                "rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition",
                draft.trim().length < 10
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700",
              ].join(" ")}
            >
              Post Answer
            </button>
          </div>
        </section>
      </div>

      {/* Right sidebar */}
      <aside className="lg:col-span-4 space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
          <p className="mt-2 text-sm text-gray-600">Helpful shortcuts (static for now).</p>

          <div className="mt-5 space-y-3">
            <Link
              to="/questions"
              className="block rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Back to Questions
            </Link>

            <button
              type="button"
              className="w-full rounded-lg bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-yellow-600"
              onClick={() => alert("Static UI: Fast response request later")}
            >
              Request Fast Response
            </button>

            <button
              type="button"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              onClick={() => alert("Static UI: Save question later")}
            >
              Save Question
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Similar Questions</h3>
          <p className="mt-2 text-sm text-gray-600">Suggested based on subject (static).</p>

          <div className="mt-5 space-y-3">
            {[
              "How to factorize x² + bx + c quickly?",
              "Common mistakes in quadratic factorization",
              "SEE Math: tips for algebra questions",
            ].map((t) => (
              <Link
                key={t}
                to="/questions"
                className="block rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-100"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-gray-900 p-6 text-white">
          <h3 className="text-lg font-bold">Need a Mentor?</h3>
          <p className="mt-2 text-sm text-gray-300">
            Discover verified instructors or top-ranked student mentors for guidance.
          </p>
          <Link
            to="/mentors"
            className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-100"
          >
            Find Mentors
          </Link>
        </div>
      </aside>
    </div>
  );
};

export default QuestionDetailsPage;
