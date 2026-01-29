import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  value: string;
  desc: string;
};

const ImpactCard = ({ icon, label, value, desc }: Props) => {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-base bg-surface p-5 shadow-sm transition hover:shadow-md">
      {/* Icon */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
        {icon}
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">{label}</p>

        <p className="mt-1 text-2xl font-bold text-basec">
          {value}
        </p>

        <p className="mt-1 text-sm text-muted leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
};

export default ImpactCard;
