import { FiGrid, FiList } from "react-icons/fi";

type CourseViewMode = "card" | "list";

type Props = {
  query: string;
  setQuery: (v: string) => void;
  level: string;
  setLevel: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  onReset: () => void;
  resultCount: number;
  viewMode: CourseViewMode;
  onViewModeChange: (viewMode: CourseViewMode) => void;
};

const CourseFilters = ({
  query,
  setQuery,
  level,
  setLevel,
  type,
  setType,
  price,
  setPrice,
  onReset,
  resultCount,
  viewMode,
  onViewModeChange,
}: Props) => {
  const hasQuery = query.trim().length > 0;
  const hasActiveFilters =
    hasQuery || level !== "All" || type !== "All" || price !== "All";

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm dark:border dark:border-gray-800 dark:bg-gray-900">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Explore</h1>
      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-200">Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses (SEE Maths, +2 Physics, MERN...)"
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-indigo-900"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-200">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="mt-2 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:focus:ring-indigo-900"
          >
            <option>All</option>
            <option>Class 8</option>
            <option>Class 9</option>
            <option>Class 10 (SEE)</option>
            <option>+2</option>
            <option>Skill</option>
          </select>
        </div>

        <div className="lg:col-span-3">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-200">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-2 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:focus:ring-indigo-900"
          >
            <option>All</option>
            <option>Academic</option>
            <option>Technical</option>
            <option>Vocational</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-200">Price</label>
          <select
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-2 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:focus:ring-indigo-900"
          >
            <option>All</option>
            <option>Free</option>
            <option>Paid</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-300 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing <span className="font-medium text-gray-900 dark:text-white">{resultCount}</span>{" "}
          course(s)
        </span>

        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onReset}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Clear
            </button>
          ) : null}

          <div className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-950">
            <button
              type="button"
              onClick={() => onViewModeChange("card")}
              className={[
                "inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                viewMode === "card"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                  : "text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-900/70",
              ].join(" ")}
              aria-pressed={viewMode === "card"}
            >
              <FiGrid className="h-4 w-4" />
              <span>Card</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={[
                "inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                  : "text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-900/70",
              ].join(" ")}
              aria-pressed={viewMode === "list"}
            >
              <FiList className="h-4 w-4" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseFilters;
