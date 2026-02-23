// src/pages/CoursesPage.tsx
import { useEffect, useMemo, useState } from "react";
import CourseCard from "../components/courses/CourseCard";
import CourseFilters from "../components/courses/CourseFilters";
import type { CourseListItem } from "../app/types/course.type";
import { coursesApi } from "../app/api/courses.api";

type CourseListRow = CourseListItem & {
  // Optional extras if your API returns them (nice for UI)
  instructor?: { name?: string; email?: string };
  totalLectures?: number;
  totalVideoSec?: number;
};

type CourseListResponse = CourseListRow[] | { items?: CourseListRow[] };

const toCourseRows = (payload: CourseListResponse): CourseListRow[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const CoursesPage = () => {
  const [courses, setCourses] = useState<CourseListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<string>("All");
  const [type, setType] = useState<string>("All");   // maps to category on backend usually
  const [price, setPrice] = useState<string>("All");

  useEffect(() => {
    let cancelled = false;

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        // NOTE: keep your existing API contract
        // If your backend expects "category" instead of "type",
        // update coursesApi.list() implementation — not this page.
        const data = (await coursesApi.list({
          q: query.trim(),
          level,
          type,
          price,
        })) as CourseListResponse;

        if (!cancelled) setCourses(toCourseRows(data));
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load courses");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, level, type, price]);

  const handleReset = () => {
    setQuery("");
    setLevel("All");
    setType("All");
    setPrice("All");
  };

  const resultCount = useMemo(() => courses.length, [courses]);

  return (
    <div className="space-y-8">
      <CourseFilters
        query={query}
        setQuery={setQuery}
        level={level}
        setLevel={setLevel}
        type={type}
        setType={setType}
        price={price}
        setPrice={setPrice}
        onReset={handleReset}
        resultCount={resultCount}
      />

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          Loading courses...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
          {error}
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          No courses found.
        </div>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </section>
      )}
    </div>
  );
};

export default CoursesPage;
