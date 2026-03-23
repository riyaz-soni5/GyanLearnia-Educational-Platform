type AdminPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

const AdminPagination = ({
  page,
  totalPages,
  onPageChange,
  className = "",
}: AdminPaginationProps) => {
  if (totalPages <= 1) return null;

  const wrapClass = `mt-6 flex flex-wrap items-center justify-between gap-3 ${className}`.trim();

  return (
    <div className={wrapClass}>
      <p className="text-xs text-gray-600">
        Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
        <span className="font-semibold text-gray-900">{totalPages}</span>
      </p>

      <div className="inline-flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Prev
        </button>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminPagination;
