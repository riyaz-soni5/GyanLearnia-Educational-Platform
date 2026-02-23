// src/components/questions/QuestionCard.tsx
import { Link, useNavigate } from "react-router-dom";
import type { Question } from "@/app/types/question.types";
import { BiUpvote } from "react-icons/bi";
import { FaRegCommentDots } from "react-icons/fa";
import { FiEye, FiBookmark, FiShare2 } from "react-icons/fi";

const formatDateOnly = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const formatRole = (role?: string) => {
  if (!role) return "Student";
  const r = String(role).toLowerCase();
  if (r === "admin") return "Admin";
  if (r === "instructor" || r === "teacher") return "Instructor";
  if (r === "tutor") return "Tutor";
  if (r === "student") return "Student";
  return role;
};

// ✅ turn HTML -> plain text (for card preview only)
const htmlToText = (html?: string) => {
  const raw = (html ?? "").trim();
  if (!raw) return "";

  // If it doesn't look like HTML, return as-is
  if (!/[<>&]/.test(raw)) return raw;

  // Browser-safe plain text extraction
  const tmp = document.createElement("div");
  tmp.innerHTML = raw;

  // remove Quill UI spans if present
  tmp.querySelectorAll(".ql-ui").forEach((n) => n.remove());

  const text = (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim();
  return text;
};

// ✅ optional: keep preview short even before line-clamp
const truncate = (s: string, max = 180) => (s.length > max ? s.slice(0, max - 1).trim() + "…" : s);

const Badge = ({
  text,
  tone,
}: {
  text: string;
  tone: "green" | "yellow" | "indigo" | "gray";
}) => {
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

const QuestionCard = ({ question }: { question: Question & { categoryName?: string } }) => {
  const nav = useNavigate();

  const answered = question.status === "Answered";
  const categoryLabel = (question as any).categoryName || question.subject || "Category";

  const authorName =
    (question as any).author && (question as any).author !== "Unknown"
      ? (question as any).author
      : "Anonymous";

  const authorTypeLabel = formatRole((question as any).authorType);

  const openDetails = () => nav(`/questions/${question.id}`);

  const onShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = `${window.location.origin}/questions/${question.id}`;
      if (navigator.share) {
        await navigator.share({ title: question.title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // ignore
    }
  };

  // ✅ plain text preview for cards
  const excerptPlain = truncate(htmlToText(question.excerpt ?? ""), 180);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") openDetails();
      }}
      className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200
                 dark:border-white/10 dark:bg-gray-900 dark:shadow-none dark:hover:ring-1 dark:hover:ring-white/10 dark:focus:ring-indigo-500/30"
    >
      <div className="flex items-start gap-4">
        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {question.hasVerifiedAnswer ? <Badge text="Verified Answer" tone="indigo" /> : null}
            {question.isFastResponse ? <Badge text="Fast Response" tone="yellow" /> : null}

            <Badge text={question.level} tone="gray" />
            <Badge text={String(categoryLabel)} tone="gray" />

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

          {/* Title: keep Link for semantics, but stop bubbling so it doesn't double-trigger */}
          <Link
            to={`/questions/${question.id}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-2 block text-lg font-semibold text-gray-900 hover:text-indigo-700 dark:text-white dark:hover:text-indigo-300"
          >
            {question.title}
          </Link>

          {/* ✅ Plain text only */}
          <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
            {excerptPlain || "No details provided."}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {(question.tags ?? []).map((t) => (
              <span
                key={t}
                onClick={(e) => e.stopPropagation()}
                className="cursor-default rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="shrink-0 whitespace-nowrap text-left md:text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateOnly(question.createdAt)}</p>
          <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{authorName}</p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{authorTypeLabel}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-3 dark:border-white/10"
      >
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-300 transition"
            title="Upvote (static)"
          >
            <BiUpvote className="h-4 w-4" />
            Upvote
          </button>

          <Link
            to={`/questions/${question.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-300 transition"
            title="Open to answer"
          >
            <FaRegCommentDots className="h-4 w-4" />
            Answer
          </Link>

          <span className="inline-flex items-center gap-2">
            <FiEye className="h-4 w-4" />
            {question.views ?? 0}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-300 transition"
            title="Save (static)"
          >
            <FiBookmark className="h-4 w-4" />
            Save
          </button>

          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-300 transition"
            title="Share"
          >
            <FiShare2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>
    </article>
  );
};

export default QuestionCard;