import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  value: string;
  desc: string;
};

const ImpactCard = ({ icon, label, value, desc }: Props) => {
  return (
    <div className="flex gap-4 rounded-xl border border-base bg-surface p-5 shadow-sm transition hover:shadow-md justify-center items-center">
      {/* Icon */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
        {icon}
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>

        <p className="mt-1 text-3xl font-bold text-basec">
          {value}
        </p>

        <p className="mt-1 text-sm leading-7 text-muted">
          {desc}
        </p>
      </div>
    </div>
  );
};

export default ImpactCard;
