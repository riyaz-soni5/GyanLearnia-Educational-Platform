import { Link } from "react-router-dom";
import type { Question } from "../../app/types/question.types";

const Badge = ({ text, tone }: { text: string; tone: "green" | "yellow" | "indigo" | "gray" }) => {
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

const QuestionRow = ({ q }: { q: Question }) => {
  const answered = q.status === "Answered";

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="grid gap-4 md:grid-cols-12 md:items-start">
        
        <div className="flex gap-3 md:col-span-3 md:flex-col md:gap-2">
          <div className="flex flex-1 items-center justify-between rounded-xl bg-gray-50 px-4 py-3 md:flex-col md:items-start md:gap-1">
            <p className="text-xs text-gray-500">Votes</p>
            <p className="text-sm font-semibold text-gray-900">{q.votes}</p>
          </div>
          <div className="flex flex-1 items-center justify-between rounded-xl bg-gray-50 px-4 py-3 md:flex-col md:items-start md:gap-1">
            <p className="text-xs text-gray-500">Answers</p>
            <p className={`text-sm font-semibold ${answered ? "text-green-700" : "text-gray-900"}`}>
              {q.answersCount}
            </p>
          </div>
          <div className="flex flex-1 items-center justify-between rounded-xl bg-gray-50 px-4 py-3 md:flex-col md:items-start md:gap-1">
            <p className="text-xs text-gray-500">Views</p>
            <p className="text-sm font-semibold text-gray-900">{q.views}</p>
          </div>
        </div>

        
        <div className="md:col-span-7">
          <div className="flex flex-wrap items-center gap-2">
            {q.hasVerifiedAnswer ? <Badge text="Verified Answer" tone="indigo" /> : null}
            {q.isFastResponse ? <Badge text="Fast Response" tone="yellow" /> : null}
            <Badge text={`${q.level}`} tone="gray" />
            <Badge text={`${q.subject}`} tone="gray" />
          </div>

          <Link
            to={`/questions/${q.id}`}
            className="mt-2 block text-lg font-semibold text-gray-900 hover:text-indigo-700"
          >
            {q.title}
          </Link>

          <p className="mt-2 line-clamp-2 text-sm text-gray-600">{q.excerpt}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {q.tags.map((t) => (
              <span
                key={t}
                className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 cursor-default"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

      
        <div className="md:col-span-2 md:text-right">
          <p className="text-xs text-gray-500">asked {q.createdAt}</p>
          <p className="mt-1 text-sm font-medium text-gray-900">{q.author}</p>
          <p className="mt-1 text-xs text-gray-600">{q.authorType ?? "Student"}</p>

          <div className="mt-4 flex gap-2 md:justify-end">
            <Link
              to={`/questions/${q.id}`}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Open
            </Link>
            <button
              type="button"
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              title="Save (static)"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default QuestionRow;
