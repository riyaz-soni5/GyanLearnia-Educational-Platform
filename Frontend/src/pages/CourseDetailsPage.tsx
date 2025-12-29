// src/pages/CourseDetailsPage.tsx
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Course } from "../app/types/course.type";

type Lesson = {
  id: string;
  title: string;
  durationMin: number;
  type: "Video" | "Note" | "Quiz";
  isPreview?: boolean;
};

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
      <path
        d="M7 3h10v18H7V3z"
        className="stroke-current"
        strokeWidth="1.8"
      />
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
      <path
        d="M7 3h10v18H7V3z"
        className="stroke-current"
        strokeWidth="1.8"
      />
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
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cls}`}>
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

  // ✅ Same mock data style as your CoursesPage (replace with API later)
  const courses: Course[] = [
    {
      id: "c1",
      title: "Mathematics (Class 10 - SEE)",
      subtitle: "Algebra, Geometry, Trigonometry — exam-focused practice",
      level: "Class 10 (SEE)",
      type: "Academic",
      priceType: "Free",
      rating: 4.6,
      lessons: 24,
      hours: 18,
      instructorName: "Verified Teacher",
      enrolled: 5320,
      badge: "Popular",
    },
    {
      id: "c2",
      title: "Physics (+2) — Mechanics",
      subtitle: "Concept + numericals with structured notes",
      level: "+2",
      type: "Academic",
      priceType: "Paid",
      priceNpr: 1499,
      rating: 4.7,
      lessons: 30,
      hours: 22,
      instructorName: "Astha Sharma",
      enrolled: 2180,
      badge: "Certified",
    },
    {
      id: "c3",
      title: "Web Development (MERN Basics)",
      subtitle: "HTML, CSS, JS, React essentials + mini projects",
      level: "Skill",
      type: "Technical",
      priceType: "Paid",
      priceNpr: 1999,
      rating: 4.5,
      lessons: 28,
      hours: 20,
      instructorName: "Srawan Shrestha",
      enrolled: 1630,
      badge: "New",
    },
  ];

  const course = useMemo(() => courses.find((c) => c.id === id), [courses, id]);

  // ✅ Static lesson list (different based on course, optional)
  const lessons: Lesson[] = useMemo(() => {
    if (!course) return [];
    if (course.id === "c1")
      return [
        { id: "l1", title: "Algebra Basics (SEE)", durationMin: 30, type: "Video", isPreview: true },
        { id: "l2", title: "Factorization & Identities", durationMin: 35, type: "Video" },
        { id: "l3", title: "Quadratic Equations (Steps)", durationMin: 20, type: "Note", isPreview: true },
        { id: "l4", title: "Practice Set: Quadratic (SEE)", durationMin: 15, type: "Quiz" },
        { id: "l5", title: "Geometry: Triangles & Circles", durationMin: 40, type: "Video" },
      ];

    if (course.id === "c2")
      return [
        { id: "l1", title: "Vectors & Units (Quick Revision)", durationMin: 25, type: "Note", isPreview: true },
        { id: "l2", title: "Newton’s Laws (Concept + Numericals)", durationMin: 45, type: "Video", isPreview: true },
        { id: "l3", title: "Friction (Common Exam Problems)", durationMin: 35, type: "Video" },
        { id: "l4", title: "Work, Energy, Power", durationMin: 40, type: "Video" },
        { id: "l5", title: "Quiz: Mechanics", durationMin: 20, type: "Quiz" },
      ];

    return [
      { id: "l1", title: "HTML + CSS Setup (Vite)", durationMin: 30, type: "Video", isPreview: true },
      { id: "l2", title: "React Components & Props", durationMin: 40, type: "Video", isPreview: true },
      { id: "l3", title: "TypeScript Basics for React", durationMin: 35, type: "Note" },
      { id: "l4", title: "Mini Project: UI Layout", durationMin: 50, type: "Video" },
      { id: "l5", title: "Quiz: React Fundamentals", durationMin: 20, type: "Quiz" },
    ];
  }, [course]);

  const [isEnrolled, setIsEnrolled] = useState(false);

  if (!course) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="text-lg font-semibold text-gray-900">Course not found</p>
        <p className="mt-2 text-sm text-gray-600">
          The course you are trying to open doesn’t exist (static demo).
        </p>
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

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Main */}
      <div className="lg:col-span-8 space-y-6">
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
            {course.badge ? (
              <Badge
                text={course.badge}
                tone={course.badge === "Certified" ? "green" : course.badge === "Popular" ? "indigo" : "yellow"}
              />
            ) : null}
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
              <p className="mt-1 text-xs text-gray-500">Preview value (static)</p>
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
              onClick={() => alert("Static UI: Save course later")}
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

        {/* Overview + Outcomes */}
        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Course Overview</h2>
          <p className="mt-3 text-sm text-gray-600">
            This is a demo overview for your FYP. Replace with real course description from backend later.
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

        {/* Lessons */}
        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Lessons</h2>
              <p className="mt-1 text-sm text-gray-600">
                Preview lessons are accessible without enrollment (static demo).
              </p>
            </div>

            <span className="text-sm font-semibold text-gray-900">
              Total: {lessons.length} items
            </span>
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
                        : "border border-gray-300 bg-white text-gray-400 cursor-not-allowed",
                    ].join(" ")}
                    onClick={() => {
                      if (!(l.isPreview || isEnrolled)) return;
                      alert("Static UI: open lesson player/notes later");
                    }}
                    disabled={!(l.isPreview || isEnrolled)}
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Note: Lesson playback/notes viewer can be implemented later as separate pages/components.
          </p>
        </section>
      </div>

      {/* Sidebar */}
      <aside className="lg:col-span-4 space-y-6">
        {/* Enrollment card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Enrollment</h3>
          <p className="mt-2 text-sm text-gray-600">
            Get access to full lessons, notes, and quizzes.
          </p>

          <div className="mt-5 rounded-2xl bg-gray-50 p-5">
            <p className="text-xs text-gray-500">Price</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{priceText}</p>
            <p className="mt-1 text-xs text-gray-500">
              {course.priceType === "Free" ? "Free course access" : "One-time demo price (static)"}
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
            onClick={() => alert("Static UI: share link later")}
          >
            Share Course
          </button>
        </div>

        {/* Instructor card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Instructor</h3>
          <p className="mt-2 text-sm text-gray-600">Profile preview (static).</p>

          <div className="mt-4 flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl bg-gray-900 text-white grid place-items-center text-sm font-bold">
              GL
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{course.instructorName}</p>
              <p className="mt-1 text-xs text-gray-500">Verified Instructor (demo)</p>

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
            Ask course-related questions in the Q&A section and get verified support.
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
