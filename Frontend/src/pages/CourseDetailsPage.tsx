// src/pages/CourseDetailsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Course } from "../app/types/course.type";
import { coursesApi, type Lesson } from "../app/api/courses.api";

const Icon = {
  Star: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2l3 7 7 .6-5.3 4.5 1.7 7L12 17.8 5.6 21.6l1.7-7L2 9.6 9 9l3-7z"
        className="stroke-current"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Clock: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10z"
        className="stroke-current"
        strokeWidth="1.8"
      />
      <path
        d="M12 6v6l4 2"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Book: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 0-2 2V4z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M6 4a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M6 18h12"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Play: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8 5l12 7-12 7V5z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Note: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M7 3h10v18H7V3z" className="stroke-current" strokeWidth="1.8" />
      <path
        d="M9 7h6M9 11h6M9 15h5"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Quiz: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M7 3h10v18H7V3z" className="stroke-current" strokeWidth="1.8" />
      <path
        d="M9 8h6M9 12h6"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9 16h.01"
        className="stroke-current"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  Shield: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-5"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const Badge = ({
  text,
  tone,
}: {
  text: string;
  tone: "indigo" | "green" | "gray" | "yellow";
}) => {
  const cls =
    tone === "indigo"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
      : tone === "green"
      ? "bg-green-50 text-green-700 ring-green-200"
      : tone === "yellow"
      ? "bg-yellow-50 text-yellow-700 ring-yellow-200"
      : "bg-gray-50 text-gray-700 ring-gray-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cls}`}
    >
      {text}
    </span>
  );
};

const lessonIcon = (type: Lesson["type"]) => {
  if (type === "Video") return <Icon.Play className="h-4 w-4" />;
  if (type === "Note") return <Icon.Note className="h-4 w-4" />;
  return <Icon.Quiz className="h-4 w-4" />;
};

const CourseDetailsPage = () => {
  const { id } = useParams<{ id: string }>();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const [c, l] = await Promise.all([coursesApi.getById(id), coursesApi.lessons(id)]);

        if (!cancelled) {
          setCourse(c);
          setLessons(l);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load course details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Loading UI
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold text-gray-900">Loading course...</p>
        <p className="mt-2 text-sm text-gray-600">Please wait a moment.</p>
      </div>
    );
  }

  // Error UI
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
        <p className="text-lg font-semibold text-red-800">Could not load course</p>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <Link
          to="/courses"
          className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Back to Courses
        </Link>
      </div>
    );
  }

  // Not found UI
  if (!course) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="text-lg font-semibold text-gray-900">Course not found</p>
        <p className="mt-2 text-sm text-gray-600">The course you are trying to open doesn’t exist.</p>
        <Link
          to="/courses"
          className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Back to Courses
        </Link>
      </div>
    );
  }

  const priceText =
    course.priceType === "Free" ? "Free" : `NPR ${course.priceNpr?.toLocaleString()}`;

  const badgeTone = useMemo(() => {
    if (!course.badge) return "gray" as const;
    if (course.badge === "Certified") return "green" as const;
    if (course.badge === "Popular") return "indigo" as const;
    return "yellow" as const;
  }, [course.badge]);

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Main */}
      <div className="space-y-6 lg:col-span-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-600">
          <Link to="/courses" className="font-semibold text-indigo-700 hover:text-indigo-800">
            Courses
          </Link>{" "}
          <span className="text-gray-400">/</span> <span className="text-gray-700">Details</span>
        </div>

        {/* Course header */}
        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {course.badge ? <Badge text={course.badge} tone={badgeTone} /> : null}
            <Badge text={course.level} tone="gray" />
            <Badge text={course.type} tone="gray" />

            <span className="ml-auto inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
              {priceText}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">{course.title}</h1>
          <p className="mt-3 text-sm text-gray-600">{course.subtitle}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-xs text-gray-500">Rating</p>
              <p className="mt-2 inline-flex items-center gap-2 text-lg font-bold text-gray-900">
                <Icon.Star className="h-5 w-5 text-gray-700" />
                {course.rating.toFixed(1)}
              </p>
              <p className="mt-1 text-xs text-gray-500">Based on enrollments</p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-xs text-gray-500">Duration</p>
              <p className="mt-2 inline-flex items-center gap-2 text-lg font-bold text-gray-900">
                <Icon.Clock className="h-5 w-5 text-gray-700" />
                {course.hours} hrs
              </p>
              <p className="mt-1 text-xs text-gray-500">{course.lessons} lessons</p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-xs text-gray-500">Instructor</p>
              <p className="mt-2 text-lg font-bold text-gray-900">{course.instructorName}</p>
              <p className="mt-1 text-xs text-gray-500">{course.enrolled.toLocaleString()} enrolled</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsEnrolled(true)}
              className={[
                "rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition",
                isEnrolled ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700",
              ].join(" ")}
            >
              {isEnrolled ? "Enrolled ✓" : course.priceType === "Free" ? "Enroll Free" : "Enroll Now"}
            </button>

            <button
              type="button"
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              onClick={() => alert("Save feature later")}
            >
              Save Course
            </button>

            <Link
              to="/questions"
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Ask a Question
            </Link>
          </div>
        </section>

        {/* Overview + Outcomes (still static text; you can fetch later) */}
        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Course Overview</h2>
          <p className="mt-3 text-sm text-gray-600">
            Replace this overview with course.description from backend later.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-6">
              <div className="flex items-center gap-2 text-gray-900">
                <Icon.Book className="h-5 w-5" />
                <p className="text-sm font-semibold">What you will learn</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li>• Key concepts explained in simple steps</li>
                <li>• Exam-focused practice and common mistakes</li>
                <li>• Notes + quizzes to verify learning</li>
                <li>• Mentor support (if enabled)</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-gray-50 p-6">
              <div className="flex items-center gap-2 text-gray-900">
                <Icon.Shield className="h-5 w-5" />
                <p className="text-sm font-semibold">For whom</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li>• Students preparing for SEE / +2 exams</li>
                <li>• Learners who want structured revision</li>
                <li>• Anyone needing concept clarity + practice</li>
                <li>• Beginners to intermediate</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Lessons (NOW dynamic) */}
        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Lessons</h2>
              <p className="mt-1 text-sm text-gray-600">
                Preview lessons are accessible without enrollment.
              </p>
            </div>

            <span className="text-sm font-semibold text-gray-900">Total: {lessons.length} items</span>
          </div>

          <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-200">
            {lessons.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
                    {lessonIcon(l.type)}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{l.title}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {l.type} • {l.durationMin} min
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {l.isPreview ? <Badge text="Preview" tone="indigo" /> : null}
                  <button
                    type="button"
                    className={[
                      "rounded-lg px-3 py-2 text-sm font-semibold transition",
                      l.isPreview || isEnrolled
                        ? "bg-gray-900 text-white hover:bg-gray-800"
                        : "cursor-not-allowed border border-gray-300 bg-white text-gray-400",
                    ].join(" ")}
                    onClick={() => {
                      if (!(l.isPreview || isEnrolled)) return;
                      alert("Open lesson player later");
                    }}
                    disabled={!(l.isPreview || isEnrolled)}
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>

          {lessons.length === 0 ? (
            <p className="mt-4 text-xs text-gray-500">No lessons available for this course yet.</p>
          ) : (
            <p className="mt-4 text-xs text-gray-500">
              Note: Lesson player/notes viewer can be implemented later.
            </p>
          )}
        </section>
      </div>

      {/* Sidebar */}
      <aside className="space-y-6 lg:col-span-4">
        {/* Enrollment card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Enrollment</h3>
          <p className="mt-2 text-sm text-gray-600">Get access to full lessons, notes, and quizzes.</p>

          <div className="mt-5 rounded-2xl bg-gray-50 p-5">
            <p className="text-xs text-gray-500">Price</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{priceText}</p>
            <p className="mt-1 text-xs text-gray-500">
              {course.priceType === "Free" ? "Free course access" : "One-time price"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsEnrolled(true)}
            className={[
              "mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition",
              isEnrolled ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700",
            ].join(" ")}
          >
            {isEnrolled ? "You are enrolled ✓" : "Enroll"}
          </button>

          <button
            type="button"
            className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            onClick={() => alert("Share feature later")}
          >
            Share Course
          </button>
        </div>

        {/* Instructor card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Instructor</h3>
          <p className="mt-2 text-sm text-gray-600">Profile preview.</p>

          <div className="mt-4 flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gray-900 text-sm font-bold text-white">
              {course.instructorName
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase())
                .join("")}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{course.instructorName}</p>
              <p className="mt-1 text-xs text-gray-500">Verified Instructor</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                  Curriculum aligned
                </span>
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                  Verified
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/mentors"
            className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Find Mentor
          </Link>
        </div>

        {/* Related */}
        <div className="rounded-2xl bg-gray-900 p-6 text-white">
          <h3 className="text-lg font-bold">Need help with this course?</h3>
          <p className="mt-2 text-sm text-gray-300">
            Ask course-related questions in the Q&amp;A section and get verified support.
          </p>
          <Link
            to="/questions"
            className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-100"
          >
            Ask a Question
          </Link>
        </div>
      </aside>
    </div>
  );
};

export default CourseDetailsPage;