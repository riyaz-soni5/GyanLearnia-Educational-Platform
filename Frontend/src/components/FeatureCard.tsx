import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  desc: string;
};

const FeatureCard = ({ icon, title, desc }: Props) => {
  return (
    <div
      className="
        flex flex-col items-center justify-center
        rounded-xl border border-base
        bg-surface p-8 text-center
        shadow-sm transition hover:shadow-md
      "
    >
      {/* Icon */}
      <div
        className="
          mb-4 flex h-14 w-14 items-center justify-center
          rounded-full bg-[rgb(var(--bg))]
          text-4xl
        "
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-basec">
        {title}
      </h3>

      {/* Description */}
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {desc}
      </p>
    </div>
  );
};

export default FeatureCard;
