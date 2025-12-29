type Props = {
  query: string;
  setQuery: (v: string) => void;
  subject: string;
  setSubject: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  resultCount: number;
};

const QuestionFilters = ({
  query,
  setQuery,
  subject,
  setSubject,
  status,
  setStatus,
  resultCount,
}: Props) => {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
        Questions & Answers
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Ask academic questions and get verified, curriculum-aligned answers.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <label className="text-xs font-medium text-gray-700">Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions (SEE Maths, Physics...)"
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="lg:col-span-3">
          <label className="text-xs font-medium text-gray-700">Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option>All</option>
            <option>Mathematics</option>
            <option>Physics</option>
            <option>Chemistry</option>
            <option>English</option>
            <option>Accountancy</option>
          </select>
        </div>

        <div className="lg:col-span-3">
          <label className="text-xs font-medium text-gray-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option>All</option>
            <option>Answered</option>
            <option>Unanswered</option>
          </select>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Showing{" "}
        <span className="font-medium text-gray-900">{resultCount}</span>{" "}
        question(s)
      </div>
    </div>
  );
};

export default QuestionFilters;
