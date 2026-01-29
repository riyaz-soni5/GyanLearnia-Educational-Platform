// src/components/questions/QuestionCard.tsx
import { Link } from "react-router-dom";
import type { Question } from "../../app/types/question.types";

const Icon = {
  Upvote: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 4l7 8h-4v8H9v-8H5l7-8z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Answer: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  View: (props: React.SVGProps<SVGSVGElement>) => (
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
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cls}`}
    >
      {text}
    </span>
  );
};

const StatPill = ({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) => {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1.5">
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-md ring-1 ring-gray-200 ${
          highlight ? "bg-green-50 text-green-700" : "bg-white text-gray-700"
        }`}
      >
        {icon}
      </span>

      <div className="leading-tight">
        <p className="text-[10px] text-gray-500">{label}</p>
        <p
          className={`text-sm font-semibold ${
            highlight ? "text-green-700" : "text-gray-900"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
};

const QuestionCard = ({ question }: { question: Question }) => {
  const answered = question.status === "Answered";

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-4">
      
        <div className="shrink-0">
          <div className="flex gap-3 md:flex-col">
            <StatPill
              label="Votes"
              value={question.votes}
              icon={<Icon.Upvote className="h-4 w-4" />}
            />
            <StatPill
              label="Answers"
              value={question.answersCount}
              highlight={answered}
              icon={<Icon.Answer className="h-4 w-4" />}
            />
            <StatPill
              label="Views"
              value={question.views}
              icon={<Icon.View className="h-4 w-4" />}
            />
          </div>
        </div>

      
        <div className="flex-1 min-w-0">
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

          <Link
            to={`/questions/${question.id}`}
            className="mt-2 block text-lg font-semibold text-gray-900 hover:text-indigo-700"
          >
            {question.title}
          </Link>

          <p className="mt-2 line-clamp-2 text-sm text-gray-600">
            {question.excerpt}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {question.tags.map((t) => (
              <span
                key={t}
                className="cursor-default rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        
        <div className="shrink-0 whitespace-nowrap text-left md:text-right">
          <p className="text-xs text-gray-500">asked {question.createdAt}</p>
          <p className="mt-1 text-sm font-medium text-gray-900">
            {question.author}
          </p>
          <p className="mt-1 text-xs text-gray-600">
            {question.authorType ?? "Student"}
          </p>
        </div>
      </div>
    </article>
  );
};

export default QuestionCard;
