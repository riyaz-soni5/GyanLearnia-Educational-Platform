// src/components/questions/QuestionToolbar.tsx
import { Link } from "react-router-dom";
import type { CategoryDTO } from "@/services/category";

type Props = {
  query: string;
  setQuery: (v: string) => void;

  // NOTE: keeping prop names for minimal refactor.
  // `subject` now holds `categoryId` (or "All")
  subject: string;
  setSubject: (v: string) => void;

  level: string;
  setLevel: (v: string) => void;

  sort: string;
  setSort: (v: string) => void;

  count: number;

  // ✅ DB-driven categories (optional)
  categories?: CategoryDTO[];
};

const LEVELS = ["All", "School", "+2/High School", "Bachelor", "Master", "PhD", "Others"] as const;

const QuestionsToolbar = ({
  query,
  setQuery,
  subject,
  setSubject,
  level,
  setLevel,
  sort,
  setSort,
  count,
  categories = [],
}: Props) => {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900 dark:shadow-none dark:ring-1 dark:ring-white/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
            Newest Questions
          </h1>
        </div>

        <Link
          to="/questions/ask"
          className="inline-flex w-fit items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Ask Question
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions (coding, engineering, maths...)"
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100
                       dark:border-white/10 dark:bg-gray-950 dark:text-white dark:focus:ring-indigo-500/20"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100
                       dark:border-white/10 dark:bg-gray-950 dark:text-white dark:focus:ring-indigo-500/20"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Category</label>
          <select
            value={subject} // holds categoryId or "All"
            onChange={(e) => setSubject(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100
                       dark:border-white/10 dark:bg-gray-950 dark:text-white dark:focus:ring-indigo-500/20"
          >
            <option value="All">All</option>

            {categories.length ? (
              categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            ) : (
              <option value="All" disabled>
                Loading categories...
              </option>
            )}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100
                       dark:border-white/10 dark:bg-gray-950 dark:text-white dark:focus:ring-indigo-500/20"
          >
            <option>Newest</option>
            <option>Most Viewed</option>
            <option>Most Voted</option>
            <option>Answered</option>
            <option>Unanswered</option>
            <option>Fast Response</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Showing <span className="font-medium text-gray-900 dark:text-white">{count}</span> question(s)
        </p>
      </div>
    </div>
  );
};

export default QuestionsToolbar;
