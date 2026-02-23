// src/components/courses/CourseCard.tsx
import { Link } from "react-router-dom";
import type { CourseListItem } from "@/app/types/course.type";

type CourseCardModel = CourseListItem & {
  instructor?: { name?: string; email?: string };
  totalLectures?: number;
  totalVideoSec?: number;
  badge?: "Popular" | "Certified" | "New" | string;
};

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

const CourseCard = ({ course, previewMode = false }: { course: CourseCardModel; previewMode?: boolean }) => {
  const priceText = course.price === 0 ? "Free" : `NPR ${Number(course.price || 0).toLocaleString()}`;

  const thumb =
    course.thumbnailUrl ??
    "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=60";

  const lectures = typeof course.totalLectures === "number" ? course.totalLectures : undefined;
  const hours =
    typeof course.totalVideoSec === "number"
      ? Math.round((course.totalVideoSec / 3600) * 10) / 10
      : undefined;

  // prefer email if available (you said your site doesn't use username)
  const instructorLine =
    course.instructor?.name?.trim() ||
    course.instructor?.email?.trim() ||
    "";

  const CardBody = (
    <>
      <div className="relative">
        <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={thumb}
            alt={course.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        </div>

        <div className="absolute left-3 top-3 flex gap-2">
          {course.badge ? <BadgePill text={course.badge} /> : null}
        </div>

        <div className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
          {course.category} • {course.level}
        </div>
      </div>

      <div className="p-5">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-gray-900 group-hover:underline dark:text-white">
          {course.title}
        </h3>

        {instructorLine ? (
          <p className="mt-2 truncate text-xs text-gray-600 dark:text-gray-300">By {instructorLine}</p>
        ) : null}

        {typeof lectures === "number" || typeof hours === "number" ? (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {typeof lectures === "number" ? `${lectures} lessons` : null}
            {typeof lectures === "number" && typeof hours === "number" ? " • " : null}
            {typeof hours === "number" ? `${hours} hrs` : null}
          </p>
        ) : null}

        <p className="mt-2 line-clamp-2 text-xs text-gray-600 dark:text-gray-300">
          {course.subtitle}
        </p>

        <div className="mt-4 flex items-end justify-between">
          <p className="text-base font-extrabold text-gray-900 dark:text-white">{priceText}</p>
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            {course.language}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      {previewMode ? (
        <div className="block">{CardBody}</div>
      ) : (
        <Link to={`/courses/${course.id}`} className="block">
          {CardBody}
        </Link>
      )}

      {!previewMode ? (
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
      ) : null}
    </article>
  );
};

export default CourseCard;
