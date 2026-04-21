import { Link } from "react-router-dom";
import { FiCompass, FiHome, FiSearch } from "react-icons/fi";

const NotFoundPage = () => {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:px-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
          <FiSearch className="h-9 w-9" />
        </div>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
          <FiCompass className="h-4 w-4" />
          Error 404
        </div>

        <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          This page does not exist.
        </h1>

        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            <FiHome className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NotFoundPage;
