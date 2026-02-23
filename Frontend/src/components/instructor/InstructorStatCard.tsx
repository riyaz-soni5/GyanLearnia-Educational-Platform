import type { ReactNode } from "react";

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
};

export default function InstructorStatCard({ label, value, hint, icon }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
          {icon}
        </div>
      </div>
    </div>
  );
}
