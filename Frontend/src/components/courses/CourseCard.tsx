// src/components/courses/CourseCard.tsx
import { Link } from "react-router-dom";
import type { Course } from "../../app/types/course.type";

const StarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 17.3l-5.2 3.1 1.4-5.9-4.6-4 6-.5L12 4.5l2.4 5.5 6 .5-4.6 4 1.4 5.9z" />
  </svg>
);

const BadgePill = ({ text }: { text: string }) => {
  const tone =
    text === "Popular"
      ? "bg-indigo-600 text-white"
      : text === "Certified"
      ? "bg-green-600 text-white"
      : text === "New"
      ? "bg-yellow-400 text-gray-900"
      : "bg-gray-900 text-white";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow ${tone}`}>
      {text}
    </span>
  );
};

const CourseCard = ({ course }: { course: Course }) => {
  const priceText =
    course.priceType === "Free" ? "Free" : `NPR ${course.priceNpr?.toLocaleString()}`;

  // If you don’t have thumbnails yet, this keeps it looking good.
  const thumb =
    course.thumbnailUrl ??
    "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=60";

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      {/* Whole top area clickable like Udemy */}
      <Link to={`/courses/${course.id}`} className="block">
        {/* Thumbnail */}
        <div className="relative">
          <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img
              src={thumb}
              alt={course.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </div>

          {/* Badge overlay */}
          <div className="absolute left-3 top-3 flex gap-2">
            {course.badge ? <BadgePill text={course.badge} /> : null}
          </div>

          {/* Type/Level overlay (subtle) */}
          <div className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
            {course.type} • {course.level}
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Title */}
          <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-gray-900 group-hover:underline dark:text-white">
            {course.title}
          </h3>

          {/* Instructor (Udemy style) */}
          <p className="mt-2 truncate text-xs text-gray-600 dark:text-gray-300">
            {course.instructorName}
          </p>

          {/* Rating row */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {course.rating.toFixed(1)}
            </span>

            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = course.rating >= i + 1;
                return (
                  <StarIcon
                    key={i}
                    className={`h-4 w-4 ${filled ? "text-yellow-400" : "text-gray-200 dark:text-gray-700"}`}
                  />
                );
              })}
            </div>

            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({course.enrolled.toLocaleString()})
            </span>
          </div>

          {/* Meta line like Udemy */}
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {course.lessons} lessons
          </p>

          {/* Small subtitle (optional — keep subtle) */}
          <p className="mt-2 line-clamp-2 text-xs text-gray-600 dark:text-gray-300">
            {course.subtitle}
          </p>

          {/* Price row (bottom) */}
          <div className="mt-4 flex items-end justify-between">
            <p className="text-base font-extrabold text-gray-900 dark:text-white">{priceText}</p>

            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {course.enrolled.toLocaleString()} students
            </span>
          </div>
        </div>
      </Link>

      {/* Bottom actions (your style, but cleaner) */}
      <div className="flex gap-3 border-t border-gray-100 p-4 dark:border-gray-800">
        <Link
          to={`/courses/${course.id}`}
          className="inline-flex flex-1 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          View
        </Link>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          title="Save (static)"
        >
          Save
        </button>
      </div>
    </article>
  );
};

export default CourseCard;