// src/pages/QuestionDetailsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Question } from "../app/types/question.types";
import { fetchAnswers, fetchQuestion, postAnswer, type AnswerDTO } from "../services/questions";

const Icon = {
  Up: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 4l7 8h-4v8H9v-8H5l7-8z" className="stroke-current" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  Down: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 20l-7-8h4V4h6v8h4l-7 8z" className="stroke-current" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  Check: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M20 6L9 17l-5-5" className="stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Eye: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" className="stroke-current" strokeWidth="1.8" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" className="stroke-current" strokeWidth="1.8" />
    </svg>
  ),
  Clock: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10z" className="stroke-current" strokeWidth="1.8" />
      <path d="M12 6v6l4 2" className="stroke-current" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Chat: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4z" className="stroke-current" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
};

const Badge = ({ text, tone }: { text: string; tone: "green" | "yellow" | "indigo" | "gray" }) => {
  const cls =
    tone === "green"
      ? "bg-green-50 text-green-700 ring-green-200"
      : tone === "yellow"
      ? "bg-yellow-50 text-yellow-700 ring-yellow-200"
      : tone === "indigo"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
      : "bg-gray-50 text-gray-700 ring-gray-200";

  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cls}`}>{text}</span>;
};

const VoteBox = ({ value, onUp, onDown }: { value: number; onUp: () => void; onDown: () => void }) => (
  <div className="flex flex-col items-center gap-2">
    <button type="button" onClick={onUp} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50" title="Upvote (later)">
      <Icon.Up className="h-5 w-5" />
    </button>
    <p className="text-sm font-bold text-gray-900">{value}</p>
    <button type="button" onClick={onDown} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50" title="Downvote (later)">
      <Icon.Down className="h-5 w-5" />
    </button>
  </div>
);

const QuestionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const questionId = id || "";

  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<AnswerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [qVotes, setQVotes] = useState(0);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [sort, setSort] = useState<"Top" | "Newest">("Top");

  useEffect(() => {
    if (!questionId) return;

    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const [qRes, aRes] = await Promise.all([
          fetchQuestion(questionId),
          fetchAnswers(questionId),
        ]);

        // ✅ If your backend returns {item: ...} keep these lines.
        // If it returns the object directly, change to: setQuestion(qRes)
        setQuestion(qRes.item);
        setQVotes(qRes.item.votes ?? 0);
        setAnswers(aRes.items ?? []);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setErr(e?.message || "Failed to load question");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [questionId]);

  // ✅ single-pass sorting (no double sort overriding)
  const sortedAnswers = useMemo(() => {
    const list = [...answers];

    const verifiedBoost = (a: AnswerDTO) => (a.isVerified ? 1_000_000 : 0);

    if (sort === "Top") {
      list.sort((a, b) => verifiedBoost(b) + b.votes - (verifiedBoost(a) + a.votes));
      return list;
    }

    // Newest (works if createdAt is ISO like 2026-02-12T10:00:00Z)
    list.sort((a, b) => {
      const bt = Date.parse(b.createdAt);
      const at = Date.parse(a.createdAt);
      // fallback if parse fails
      return (isNaN(bt) ? 0 : bt) - (isNaN(at) ? 0 : at);
    });

    // keep verified answers on top even in newest mode (optional)
    list.sort((a, b) => Number(Boolean(b.isVerified)) - Number(Boolean(a.isVerified)));
    return list;
  }, [answers, sort]);

  const addAnswer = async () => {
    const text = draft.trim();
    if (text.length < 10) return;

    setPosting(true);
    try {
      const res = await postAnswer(questionId, text);
      setAnswers((prev) => [res.answer, ...prev]);
      setDraft("");
    } catch (e: any) {
      alert(e?.message || "Failed to post answer");
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-600">
        Loading question...
      </div>
    );
  }

  if (err || !question) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="text-lg font-semibold text-gray-900">Question not found</p>
        <p className="mt-2 text-sm text-gray-600">
          {err || "The question you are trying to open doesn’t exist."}
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

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8 space-y-6">
        <div className="text-sm text-gray-600">
          <Link
            to="/questions"
            className="font-semibold text-indigo-700 hover:text-indigo-800"
          >
            Questions
          </Link>{" "}
          <span className="text-gray-400">/</span>{" "}
          <span className="text-gray-700">Details</span>
        </div>

        {/* Question Card */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-5">
            <VoteBox
              value={qVotes}
              onUp={() => setQVotes((v) => v + 1)}
              onDown={() => setQVotes((v) => Math.max(0, v - 1))}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {question.hasVerifiedAnswer ? (
                  <Badge text="Verified Answer" tone="indigo" />
                ) : null}
                {question.isFastResponse ? (
                  <Badge text="Fast Response" tone="yellow" />
                ) : null}
                <Badge text={question.level} tone="gray" />
                <Badge text={question.subject} tone="gray" />

                <span
                  className={`ml-auto inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                    answered
                      ? "bg-green-50 text-green-700 ring-green-200"
                      : "bg-yellow-50 text-yellow-700 ring-yellow-200"
                  }`}
                >
                  {question.status}
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-bold text-gray-900">
                {question.title}
              </h1>

              <p className="mt-3 whitespace-pre-line text-sm text-gray-700">
                {question.excerpt}
              </p>

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
                  {/* your Icon.Eye */}
                  {question.views} views
                </span>
                <span className="inline-flex items-center gap-2">
                  asked {question.createdAt}
                </span>
                <span className="inline-flex items-center gap-2">
                  {question.author} ({question.authorType ?? "Student"})
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Answers */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Answers ({answers.length})
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Verified answers are highlighted.
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
                  a.isVerified
                    ? "border-indigo-300 bg-indigo-50/40"
                    : "border-gray-200 bg-white",
                ].join(" ")}
              >
                <div className="flex items-start gap-4">
                  {/* keep VoteBox UI only for now */}
                  <VoteBox value={a.votes} onUp={() => {}} onDown={() => {}} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {a.isVerified ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                          <Icon.Check className="h-4 w-4" />
                          Verified Answer
                        </span>
                      ) : null}

                      <span className="ml-auto text-xs text-gray-500">
                        {isNaN(Date.parse(a.createdAt))
                          ? a.createdAt
                          : new Date(a.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="mt-3 whitespace-pre-line text-sm text-gray-700">
                      {a.content}
                    </p>

                    <div className="mt-4 text-sm text-gray-600">
                      Answered by{" "}
                      <span className="font-semibold text-gray-900">
                        {a.author}
                      </span>{" "}
                      <span className="text-xs text-gray-500">
                        ({a.authorType ?? "Student"})
                      </span>
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

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            placeholder="Type your answer..."
            className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500">Minimum 10 characters.</p>
            <button
              type="button"
              onClick={addAnswer}
              disabled={posting || draft.trim().length < 10}
              className={[
                "rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition",
                posting || draft.trim().length < 10
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700",
              ].join(" ")}
            >
              {posting ? "Posting..." : "Post Answer"}
            </button>
          </div>
        </section>
      </div>

      <aside className="lg:col-span-4 space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
          <div className="mt-5 space-y-3">
            <Link
              to="/questions"
              className="block rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Back to Questions
            </Link>
          </div>
        </div>

        {/* if you want leaderboard dynamic later, keep static for now */}
        {/* <Leaderboard /> */}
      </aside>
    </div>
  );
};

export default QuestionDetailsPage;