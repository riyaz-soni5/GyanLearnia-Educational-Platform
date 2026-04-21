import { Link } from "react-router-dom";
import { FiStar, FiUsers } from "react-icons/fi";
import type { CourseListItem } from "@/app/types/course.type";

type CourseViewMode = "card" | "list";
type CourseCardSize = "default" | "compact";

type CourseCardModel = CourseListItem & {
  instructor?: { name?: string; email?: string };
  totalLectures?: number;
  totalVideoSec?: number;
  badge?: "Popular" | "Certified" | "New" | string;
};

const CourseCard = ({
  course,
  previewMode = false,
  viewMode = "card",
  size = "default",
}: {
  course: CourseCardModel;
  previewMode?: boolean;
  viewMode?: CourseViewMode;
  size?: CourseCardSize;
}) => {
  const priceText = course.price === 0 ? "Free" : `NPR ${Number(course.price || 0).toLocaleString()}`;

  const thumb =
    course.thumbnailUrl ??
    "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=60";

  const lectures = typeof course.totalLectures === "number" ? course.totalLectures : undefined;
  const hours =
    typeof course.totalVideoSec === "number"
      ? Math.round((course.totalVideoSec / 3600) * 10) / 10
      : undefined;
  const averageRating = Number(course.averageRating ?? course.rating ?? 0);
  const reviewsCount = Math.max(0, Number(course.reviewsCount ?? 0));
  const enrolledCount = Math.max(0, Number(course.enrolled ?? 0));
  const instructorLine =
    course.instructor?.name?.trim() ||
    course.instructor?.email?.trim() ||
    "";
  const badgeClass =
    course.badge === "Popular"
      ? "bg-indigo-600 text-white"
      : course.badge === "Certified"
      ? "bg-green-600 text-white"
      : course.badge === "New"
      ? "bg-yellow-400 text-gray-900"
      : "bg-gray-900 text-white";
  const isListView = viewMode === "list";
  const isCompact = size === "compact";

  const cardContent = (
    <>
      <div className="relative">
        <div
          className={[
            "w-full overflow-hidden bg-gray-100 dark:bg-gray-800",
            isCompact ? "aspect-[1.95/1]" : "aspect-video",
          ].join(" ")}
        >
          <img
            src={thumb}
            alt={course.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        </div>

        <div className="absolute left-3 top-3 flex gap-2">
          {course.badge ? (
            <span
              className={[
                "inline-flex items-center rounded-full font-semibold shadow",
                isCompact ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
                badgeClass,
              ].join(" ")}
            >
              {course.badge}
            </span>
          ) : null}
        </div>

        <div
          className={[
            "absolute bottom-3 left-3 rounded-full bg-black/70 font-medium text-white",
            isCompact ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
          ].join(" ")}
        >
          {course.category} • {course.level}
        </div>
      </div>

      <div className={isCompact ? "p-4" : "p-5"}>
        <h3
          className={[
            "line-clamp-2 font-bold leading-snug text-gray-900 group-hover:underline dark:text-white",
            isCompact ? "text-sm" : "text-[15px]",
          ].join(" ")}
        >
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

        <div
          className={[
            "mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400",
            isCompact ? "gap-2.5" : "gap-3",
          ].join(" ")}
        >
          <span className="inline-flex items-center gap-1">
            <FiStar className="h-3.5 w-3.5 text-amber-500" />
            {reviewsCount > 0 ? `${averageRating.toFixed(1)} (${reviewsCount})` : "No ratings"}
          </span>
          <span className="inline-flex items-center gap-1">
            <FiUsers className="h-3.5 w-3.5" />
            {enrolledCount} students
          </span>
        </div>

        <p
          className={[
            "mt-2 line-clamp-2 text-gray-600 dark:text-gray-300",
            isCompact ? "text-[11px]" : "text-xs",
          ].join(" ")}
        >
          {course.subtitle}
        </p>

        <div className="mt-4 flex items-end justify-between">
          <p
            className={[
              "font-extrabold text-gray-900 dark:text-white",
              isCompact ? "text-sm" : "text-base",
            ].join(" ")}
          >
            {priceText}
          </p>
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            {course.language}
          </span>
        </div>
      </div>
    </>
  );

  const listContent = (
    <div className="flex flex-col md:flex-row">
      <div className={["relative md:shrink-0", isCompact ? "md:w-60" : "md:w-72"].join(" ")}>
        <div
          className={[
            "w-full overflow-hidden bg-gray-100 dark:bg-gray-800 md:h-full md:aspect-auto",
            isCompact ? "aspect-[1.9/1]" : "aspect-video",
          ].join(" ")}
        >
          <img
            src={thumb}
            alt={course.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        </div>

        <div className="absolute left-3 top-3 flex gap-2">
          {course.badge ? (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow ${badgeClass}`}>
              {course.badge}
            </span>
          ) : null}
        </div>
      </div>

      <div className={["flex min-w-0 flex-1 flex-col", isCompact ? "p-4" : "p-5"].join(" ")}>
        <div
          className={[
            "flex flex-wrap items-center text-xs font-medium text-gray-500 dark:text-gray-400",
            isCompact ? "gap-1.5" : "gap-2",
          ].join(" ")}
        >
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            {course.category}
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700 dark:bg-white/5 dark:text-gray-200">
            {course.level}
          </span>
          <span>{course.language}</span>
          {course.isEnrolled ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              Enrolled
            </span>
          ) : null}
        </div>

        <h3
          className={[
            "mt-3 font-bold leading-snug text-gray-900 group-hover:underline dark:text-white",
            isCompact ? "text-lg" : "text-xl",
          ].join(" ")}
        >
          {course.title}
        </h3>

        {instructorLine ? (
          <p className={["mt-2 text-gray-600 dark:text-gray-300", isCompact ? "text-xs" : "text-sm"].join(" ")}>
            By {instructorLine}
          </p>
        ) : null}

        <p
          className={[
            "mt-3 line-clamp-2 text-gray-600 dark:text-gray-300",
            isCompact ? "text-xs leading-6" : "text-sm leading-7",
          ].join(" ")}
        >
          {course.subtitle}
        </p>

        <div
          className={[
            "mt-4 flex flex-wrap items-center text-gray-500 dark:text-gray-400",
            isCompact ? "gap-x-4 gap-y-1.5 text-xs" : "gap-x-5 gap-y-2 text-sm",
          ].join(" ")}
        >
          <span className="inline-flex items-center gap-1">
            <FiStar className={[isCompact ? "h-3.5 w-3.5" : "h-4 w-4", "text-amber-500"].join(" ")} />
            {reviewsCount > 0 ? `${averageRating.toFixed(1)} (${reviewsCount})` : "No ratings"}
          </span>
          <span className="inline-flex items-center gap-1">
            <FiUsers className={isCompact ? "h-3.5 w-3.5" : "h-4 w-4"} />
            {enrolledCount} students
          </span>
          {typeof lectures === "number" ? <span>{lectures} lessons</span> : null}
          {typeof hours === "number" ? <span>{hours} hrs</span> : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <p
            className={[
              "font-extrabold text-gray-900 dark:text-white",
              isCompact ? "text-base" : "text-lg",
            ].join(" ")}
          >
            {priceText}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <article
      className={[
        "group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900",
        isListView ? "w-full" : "",
      ].join(" ")}
    >
      {previewMode ? (
        <div className="block">{isListView ? listContent : cardContent}</div>
      ) : (
        <Link to={`/courses/${course.id}`} className="block cursor-pointer">
          {isListView ? listContent : cardContent}
        </Link>
      )}

      {!previewMode && course.isEnrolled && !isListView ? (
        <div className={["border-t border-gray-100 dark:border-gray-800", isCompact ? "p-3" : "p-4"].join(" ")}>
          <Link
            to={`/courses/${course.id}`}
            className={[
              "inline-flex w-full cursor-pointer items-center justify-center rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700",
              isCompact ? "px-4 py-2 text-xs" : "px-4 py-2.5 text-sm",
            ].join(" ")}
          >
            View
          </Link>
        </div>
      ) : null}
    </article>
  );
};

export default CourseCard;
