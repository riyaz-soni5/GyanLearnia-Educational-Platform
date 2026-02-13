import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Question } from "../app/types/question.types";
import { fetchAnswers, fetchQuestion, postAnswer, type AnswerDTO } from "../services/questions";

// ✅ react-icons (no SVG)
import { BiUpvote, BiDownvote } from "react-icons/bi";
import { FiEye } from "react-icons/fi";
import { FaRegCommentDots } from "react-icons/fa";
import { HiCheckCircle } from "react-icons/hi2";

const Badge = ({ text, tone }: { text: string; tone: "green" | "yellow" | "indigo" | "gray" }) => {
  const cls =
    tone === "green"
      ? "bg-green-50 text-green-700 ring-green-200 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/20"
      : tone === "yellow"
      ? "bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:ring-yellow-500/20"
      : tone === "indigo"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20"
      : "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10";

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
      className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
      title="Upvote (later)"
    >
      <BiUpvote className="h-5 w-5" />
    </button>

    <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>

    <button
      type="button"
      onClick={onDown}
      className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
      title="Downvote (later)"
    >
      <BiDownvote className="h-5 w-5" />
    </button>
  </div>
);

// ✅ date only (no time)
const formatDateOnly = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
};

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
        const [qRes, aRes] = await Promise.all([fetchQuestion(questionId), fetchAnswers(questionId)]);

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

  const sortedAnswers = useMemo(() => {
    const list = [...answers];
    const verifiedBoost = (a: AnswerDTO) => (a.isVerified ? 1_000_000 : 0);

    if (sort === "Top") {
      list.sort((a, b) => verifiedBoost(b) + b.votes - (verifiedBoost(a) + a.votes));
      return list;
    }

    list.sort((a, b) => {
      const bt = Date.parse(b.createdAt);
      const at = Date.parse(a.createdAt);
      return (isNaN(bt) ? 0 : bt) - (isNaN(at) ? 0 : at);
    });

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
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-600 dark:border-white/10 dark:bg-gray-900 dark:text-gray-300">
        Loading question...
      </div>
    );
  }

  if (err || !question) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-white/10 dark:bg-gray-900">
        <p className="text-lg font-semibold text-gray-900 dark:text-white">Question not found</p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
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
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <Link to="/questions" className="font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200">
            Questions
          </Link>{" "}
          <span className="text-gray-400">/</span>{" "}
          <span className="text-gray-700 dark:text-gray-200">Details</span>
        </div>

        {/* Question Card */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
          <div className="flex items-start gap-5">
            <VoteBox value={qVotes} onUp={() => setQVotes((v) => v + 1)} onDown={() => setQVotes((v) => Math.max(0, v - 1))} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {question.hasVerifiedAnswer ? <Badge text="Verified Answer" tone="indigo" /> : null}
                {question.isFastResponse ? <Badge text="Fast Response" tone="yellow" /> : null}
                <Badge text={question.level} tone="gray" />
                <Badge text={question.subject ?? "General"} tone="gray" />

                <span
                  className={[
                    "ml-auto inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                    answered
                      ? "bg-green-50 text-green-700 ring-green-200 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/20"
                      : "bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:ring-yellow-500/20",
                  ].join(" ")}
                >
                  {question.status}
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{question.title}</h1>

              {/* ✅ Rich text render (excerpt is HTML from ReactQuill) */}
              <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-gray-950">
                <div
                  className="ql-editor"
                  dangerouslySetInnerHTML={{ __html: question.excerpt ?? "" }}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {question.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <span className="inline-flex items-center gap-2">
                  <FiEye className="h-4 w-4" />
                  {question.views} views
                </span>
                <span className="inline-flex items-center gap-2">{formatDateOnly(question.createdAt)}</span>
                <span className="inline-flex items-center gap-2">
                  {question.author} ({question.authorType ?? "Student"})
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Answers */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Answers ({answers.length})</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Verified answers are highlighted.</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Sort</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "Top" | "Newest")}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-gray-950 dark:text-white dark:focus:ring-indigo-500/20"
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
                    ? "border-indigo-300 bg-indigo-50/40 dark:border-indigo-500/30 dark:bg-indigo-500/10"
                    : "border-gray-200 bg-white dark:border-white/10 dark:bg-gray-950",
                ].join(" ")}
              >
                <div className="flex items-start gap-4">
                  <VoteBox value={a.votes} onUp={() => {}} onDown={() => {}} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {a.isVerified ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20">
                          <HiCheckCircle className="h-4 w-4" />
                          Verified Answer
                        </span>
                      ) : null}

                      <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                        {formatDateOnly(a.createdAt)}
                      </span>
                    </div>

                    {/* ✅ Rich text render for answers too (if you later switch answers to rich editor) */}
                    <p className="mt-3 whitespace-pre-line text-sm text-gray-700 dark:text-gray-200">
                      {a.content}
                      
                    </p>

                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                      Answered by{" "}
                      <span className="font-semibold text-gray-900 dark:text-white">{a.author}</span>{" "}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
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
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
            <FaRegCommentDots className="h-5 w-5" />
            <h3 className="text-lg font-bold">Write your answer</h3>
          </div>

          {/* Keep textarea for now; if you want rich answer editor, swap with ReactQuill same as Ask page */}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            placeholder="Type your answer..."
            className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-gray-950 dark:text-white dark:focus:ring-indigo-500/20"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Minimum 10 characters.</p>
            <button
              type="button"
              onClick={addAnswer}
              disabled={posting || draft.trim().length < 10}
              className={[
                "rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition",
                posting || draft.trim().length < 10 ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700",
              ].join(" ")}
            >
              {posting ? "Posting..." : "Post Answer"}
            </button>
          </div>
        </section>
      </div>

      <aside className="lg:col-span-4 space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h3>
          <div className="mt-5 space-y-3">
            <Link
              to="/questions"
              className="block rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
            >
              Back to Questions
            </Link>
          </div>
        </div>
      </aside>
      
    </div>

    
  );
};

export default QuestionDetailsPage;