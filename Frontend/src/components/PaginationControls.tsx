type PaginationControlsProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

const PaginationControls = ({
  page,
  totalPages,
  onPageChange,
  className = "",
}: PaginationControlsProps) => {
  if (totalPages <= 1) return null;

  const boxClass = `mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-gray-900 ${className}`.trim();

  return (
    <div className={boxClass}>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Page <span className="font-semibold text-gray-900 dark:text-white">{page}</span> of{" "}
        <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
      </p>

      <div className="inline-flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-white dark:hover:bg-gray-800"
        >
          Prev
        </button>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-white dark:hover:bg-gray-800"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
