
import { Link } from "react-router-dom";

type Props = {
  query: string;
  setQuery: (v: string) => void;
  subject: string;
  setSubject: (v: string) => void;
  level: string;
  setLevel: (v: string) => void;
  sort: string;
  setSort: (v: string) => void;
  count: number;
};

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
}: Props) => {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Newest Questions</h1>
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
          <label className="text-xs font-medium text-gray-700">Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions (SEE Maths, +2 Physics...)"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="text-xs font-medium text-gray-700">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option>All</option>
            <option>Class 8</option>
            <option>Class 9</option>
            <option>Class 10 (SEE)</option>
            <option>+2</option>
          </select>
        </div>

        <div className="lg:col-span-3">
          <label className="text-xs font-medium text-gray-700">Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option>All</option>
            <option>Mathematics</option>
            <option>Physics</option>
            <option>Chemistry</option>
            <option>English</option>
            <option>Accountancy</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="text-xs font-medium text-gray-700">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option>Newest</option>
            <option>Most Viewed</option>
            <option>Most Voted</option>
            <option>Unanswered</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl mt-3 border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            Need urgent help? Use <span className="font-semibold text-gray-900">Fast Response</span> to get priority answers.
          </p>
          <button
            type="button"
            className="inline-flex w-fit items-center justify-center rounded-lg bg-yellow-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-yellow-600"
          >
            Request Fast Response
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium text-gray-900">{count}</span> question(s)
        </p>
      </div>
    </div>
  );
};

export default QuestionsToolbar;
