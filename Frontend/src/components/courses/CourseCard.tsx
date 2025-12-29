import { Link } from "react-router-dom";
import type { Course } from "../../app/types/course.type";


const CourseCard = ({ course }: { course: Course }) => {
  return (
    <article className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500">
            {course.type} • {course.level}
          </p>

          <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-gray-900 group-hover:text-indigo-700">
            {course.title}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm text-gray-600">
            {course.subtitle}
          </p>
        </div>

        {course.badge ? (
          <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {course.badge}
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-4">
        <div>
          <p className="text-[11px] font-medium text-gray-500">Rating</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {course.rating.toFixed(1)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-gray-500">Lessons</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {course.lessons}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-gray-500">Hours</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {course.hours}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">Instructor</p>
          <p className="truncate text-sm font-medium text-gray-900">
            {course.instructorName}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">Price</p>
          <p className="text-sm font-semibold text-gray-900">
            {course.priceType === "Free"
              ? "Free"
              : `NPR ${course.priceNpr?.toLocaleString()}`}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Link
          to={`/courses/${course.id}`}
          className="inline-flex flex-1 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium hover:bg-indigo-700"
        >
          <p className="text-white">View Details</p>
        </Link>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          title="Save (static)"
        >
          Save
        </button>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        {course.enrolled.toLocaleString()} enrolled
      </p>
    </article>
  );
};

export default CourseCard;
