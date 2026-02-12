// src/components/courses/CourseFilters.tsx
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
}: Props) => {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900 dark:border dark:border-gray-800">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">Explore</h1>
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
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:focus:ring-indigo-900"
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
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:focus:ring-indigo-900"
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
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:focus:ring-indigo-900"
          >
            <option>All</option>
            <option>Free</option>
            <option>Paid</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
        <span>
          Showing <span className="font-medium text-gray-900 dark:text-white">{resultCount}</span>{" "}
          course(s)
        </span>

        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default CourseFilters;