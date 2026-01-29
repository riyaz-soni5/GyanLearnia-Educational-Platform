import { Link } from "react-router-dom";

function RoleCard({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="group flex w-full items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-6 py-5 text-left transition hover:bg-indigo-100"
    >
      <span className="text-lg font-semibold text-indigo-800">{label}</span>

      {/* Arrow icon */}
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/70 text-indigo-700 ring-1 ring-indigo-200 transition group-hover:bg-white">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
          <path
            d="M9 6l6 6-6 6"
            className="stroke-current"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}

export default RoleCard;