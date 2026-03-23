import { Link, useNavigate } from "react-router-dom";
import type { Question } from "@/app/types/question.types";
import { BiUpvote } from "react-icons/bi";
import { FaRegCommentDots } from "react-icons/fa";
import { FiEye, FiShare2 } from "react-icons/fi";
import { useToast } from "@/components/toast";

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

const htmlToText = (html?: string) => {
  const raw = (html ?? "").trim();
  if (!raw) return "";
  if (!/[<>&]/.test(raw)) return raw;

  const tmp = document.createElement("div");
  tmp.innerHTML = raw;
  tmp.querySelectorAll(".ql-ui").forEach((n) => n.remove());

  const text = (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim();
  return text;
};

const truncate = (s: string, max = 180) => (s.length > max ? s.slice(0, max - 1).trim() + "…" : s);

type QuestionCardItem = Question & {
  categoryName?: string;
  myVote?: 1 | -1 | null;
  author?: string;
  authorType?: string;
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
      ? "bg-green-50 text-green-700 ring-green-200 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/20"
      : tone === "yellow"
      ? "bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:ring-yellow-500/20"
      : tone === "indigo"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20"
      : "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10";

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cls}`}
    >
      {text}
    </span>
  );
};

const QuestionCard = ({
  question,
  onUpvoteQuestion,
  isUpvoteLoading = false,
}: {
  question: QuestionCardItem;
  onUpvoteQuestion?: (questionId: string) => void;
  isUpvoteLoading?: boolean;
}) => {
  const nav = useNavigate();
  const { showToast } = useToast();
  const isUpvoted = question.myVote === 1;

  const answered = question.status === "Answered";
  const categoryLabel = question.categoryName || question.subject || "Category";
  const isFastResponse = Boolean(question.isFastResponse);
  const authorName =
    question.author && question.author !== "Unknown" ? question.author : "Anonymous";
  const authorTypeLabel = formatRole(question.authorType);

  const openDetails = () => nav(`/questions/${question.id}`);

  const onShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/questions/${question.id}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      showToast("Question link copied", "success");
    } catch {
      showToast("Failed to copy question link", "error");
    }
  };

  const excerptPlain = truncate(htmlToText(question.excerpt ?? ""), 180);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={openDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") openDetails();
      }}
      className={[
        "cursor-pointer rounded-2xl border p-4 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:p-5 dark:shadow-none dark:hover:ring-1 dark:hover:ring-white/10 dark:focus:ring-indigo-500/30",
        isFastResponse
          ? "border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-white dark:border-amber-500/30 dark:bg-[linear-gradient(135deg,rgba(245,158,11,0.14),rgba(234,179,8,0.08),rgba(17,24,39,0.92))]"
          : "border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {Number(question.fastResponsePrice || 0) > 0 ? (
              <Badge text={`Reward NPR ${Number(question.fastResponsePrice || 0).toFixed(2)}`} tone="green" />
            ) : null}

            <Badge text={question.level} tone="gray" />
            <Badge text={String(categoryLabel)} tone="gray" />

            <span
              className={[
                "md:ml-auto inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                answered
                  ? "bg-green-50 text-green-700 ring-green-200 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/20"
                  : "bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:ring-yellow-500/20",
              ].join(" ")}
            >
              {question.status}
            </span>
          </div>

          <Link
            to={`/questions/${question.id}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-2 block break-words text-base font-semibold text-gray-900 hover:text-indigo-700 sm:text-lg dark:text-white dark:hover:text-indigo-300"
          >
            {question.title}
          </Link>

          <p className="mt-2 line-clamp-2 break-words text-sm text-gray-600 dark:text-gray-300">
            {excerptPlain || "No details provided."}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {(question.tags ?? []).map((t) => (
              <span
                key={t}
                onClick={(e) => e.stopPropagation()}
                className="cursor-default break-all rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="w-full shrink-0 border-t border-gray-100 pt-3 text-left dark:border-white/10 md:w-auto md:border-t-0 md:pt-0 md:text-right md:whitespace-nowrap">
          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateOnly(question.createdAt)}</p>
          <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{authorName}</p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{authorTypeLabel}</p>
        </div>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-3 dark:border-white/10 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 sm:gap-4 dark:text-gray-300">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpvoteQuestion?.(question.id);
            }}
            disabled={isUpvoteLoading}
            className={[
              "inline-flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 transition",
              isUpvoteLoading ? "cursor-not-allowed opacity-50" : "",
              isUpvoted
                ? "bg-indigo-600 text-white"
                : "hover:text-indigo-600 dark:hover:text-indigo-300",
            ].join(" ")}
            title="Upvote"
          >
            <BiUpvote className="h-4 w-4" />
            Upvote
          </button>

          <Link
            to={`/questions/${question.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex cursor-pointer items-center gap-2 transition hover:text-indigo-600 dark:hover:text-indigo-300"
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

        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 sm:gap-4 dark:text-gray-300">
          <button
            type="button"
            onClick={onShare}
            className="inline-flex cursor-pointer items-center gap-2 transition hover:text-indigo-600 dark:hover:text-indigo-300"
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
