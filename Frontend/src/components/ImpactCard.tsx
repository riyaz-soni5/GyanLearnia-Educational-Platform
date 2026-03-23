import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  value: string;
  desc: string;
};

const ImpactCard = ({ icon, label, value, desc }: Props) => {
  return (
    <div className="flex items-center justify-center gap-5 rounded-xl border border-base bg-surface p-5 shadow-sm transition hover:shadow-md">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-[1.75rem] shadow-sm">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>

        <p className="mt-1 text-3xl font-bold text-basec">{value}</p>

        <p className="mt-1 text-sm leading-7 text-muted">{desc}</p>
      </div>
    </div>
  );
};

export default ImpactCard;
