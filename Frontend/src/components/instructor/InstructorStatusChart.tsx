type Props = {
  draft: number;
  pending: number;
  published: number;
  rejected: number;
};

const rows = [
  { key: "published", label: "Published", color: "bg-green-500" },
  { key: "pending", label: "Pending", color: "bg-amber-500" },
  { key: "rejected", label: "Rejected", color: "bg-red-500" },
  { key: "draft", label: "Draft", color: "bg-slate-500" },
] as const;

export default function InstructorStatusChart({ draft, pending, published, rejected }: Props) {
  const values = { draft, pending, published, rejected };
  const total = Math.max(1, draft + pending + published + rejected);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold text-gray-900">Course Status</h3>
      <p className="mt-1 text-xs text-gray-500">Distribution of your courses by status.</p>

      <div className="mt-4 space-y-3">
        {rows.map((row) => {
          const count = values[row.key];
          const pct = Math.round((count / total) * 100);
          return (
            <div key={row.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700">{row.label}</span>
                <span className="text-gray-500">
                  {count} ({pct}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className={`h-2 rounded-full ${row.color}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
