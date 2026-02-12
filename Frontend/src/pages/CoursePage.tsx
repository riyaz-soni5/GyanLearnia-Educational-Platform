// src/pages/CoursesPage.tsx
import { useEffect, useMemo, useState } from "react";
import CourseCard from "../components/courses/CourseCard";
import CourseFilters from "../components/courses/CourseFilters";
import type { Course } from "../app/types/course.type";
import { coursesApi } from "../app/api/courses.api";

const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<string>("All");
  const [type, setType] = useState<string>("All");
  const [price, setPrice] = useState<string>("All");

  // Option A (recommended): fetch filtered results from backend
  useEffect(() => {
    let cancelled = false;

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const data = await coursesApi.list({
          q: query.trim(),
          level,
          type,
          price,
        });
        if (!cancelled) setCourses(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load courses");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250); // small debounce so typing doesn't spam API

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

  // If you want local filtering instead, you can keep your old useMemo.
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

      {/* States */}
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