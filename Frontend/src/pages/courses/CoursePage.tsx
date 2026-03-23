import { useEffect, useMemo, useState } from "react";
import CourseCard from "@/components/courses/CourseCard";
import CourseFilters from "@/components/courses/CourseFilters";
import PaginationControls from "@/components/PaginationControls";
import type { CourseListItem } from "@/app/types/course.type";
import { coursesApi } from "@/app/api/courses.api";

type CourseListRow = CourseListItem & {
  instructor?: { name?: string; email?: string };
  totalLectures?: number;
  totalVideoSec?: number;
};

type CourseListResponse =
  | CourseListRow[]
  | { items?: CourseListRow[]; total?: number; page?: number; limit?: number };

const COURSE_PAGE_SIZE = 9;

const normalizeCourseList = (payload: CourseListResponse) => {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: 1,
      limit: payload.length || COURSE_PAGE_SIZE,
    };
  }

  const items = Array.isArray(payload?.items) ? payload.items : [];
  return {
    items,
    total: Number(payload?.total ?? items.length),
    page: Number(payload?.page ?? 1),
    limit: Number(payload?.limit ?? COURSE_PAGE_SIZE),
  };
};

const CoursesPage = () => {
  const [courses, setCourses] = useState<CourseListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<string>("All");
  const [type, setType] = useState<string>("All");
  const [price, setPrice] = useState<string>("All");

  useEffect(() => {
    let cancelled = false;

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const data = (await coursesApi.list({
          q: query.trim(),
          level,
          type,
          price,
          page,
          limit: COURSE_PAGE_SIZE,
        })) as CourseListResponse;
        const normalized = normalizeCourseList(data);

        if (!cancelled) {
          setCourses(normalized.items);
          setTotal(normalized.total);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load courses");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [page, query, level, type, price]);

  const handleQueryChange = (value: string) => {
    setPage(1);
    setQuery(value);
  };

  const handleLevelChange = (value: string) => {
    setPage(1);
    setLevel(value);
  };

  const handleTypeChange = (value: string) => {
    setPage(1);
    setType(value);
  };

  const handlePriceChange = (value: string) => {
    setPage(1);
    setPrice(value);
  };

  const handleReset = () => {
    setPage(1);
    setQuery("");
    setLevel("All");
    setType("All");
    setPrice("All");
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / COURSE_PAGE_SIZE)),
    [total]
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="space-y-8">
        <CourseFilters
          query={query}
          setQuery={handleQueryChange}
          level={level}
          setLevel={handleLevelChange}
          type={type}
          setType={handleTypeChange}
          price={price}
          setPrice={handlePriceChange}
          onReset={handleReset}
          resultCount={total}
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

        {!loading && !error ? (
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
        ) : null}
      </div>
    </div>
  );
};

export default CoursesPage;
