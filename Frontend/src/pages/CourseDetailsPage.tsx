// src/pages/CourseDetailsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiBarChart2,
  FiBookOpen,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiFileText,
  FiGlobe,
  FiHelpCircle,
  FiPaperclip,
  FiPlayCircle,
  FiShield,
  FiStar,
  FiUsers,
} from "react-icons/fi";
import { coursesApi } from "../app/api/courses.api";

type LectureKind = "Video" | "Note" | "Quiz" | "File";

type UiLecture = {
  id: string;
  title: string;
  type: LectureKind;
  durationMin: number;
  isPreview: boolean;
};

type UiSection = {
  id: string;
  title: string;
  lectures: UiLecture[];
};

type CourseUiModel = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: string;
  language: string;
  priceType: "Free" | "Paid";
  priceNpr: number;
  rating: number;
  hours: number;
  lessons: number;
  enrolled: number;
  instructorName: string;
  thumbnailUrl: string;
  outcomes: string[];
  requirements: string[];
  sections: UiSection[];
  updatedAt?: string;
};

type RawLecture = {
  _id?: unknown;
  id?: unknown;
  title?: unknown;
  type?: unknown;
  durationSec?: unknown;
  isFreePreview?: unknown;
  isPreview?: unknown;
};

type RawSection = {
  _id?: unknown;
  id?: unknown;
  title?: unknown;
  lectures?: unknown;
};

type RawCourse = {
  item?: unknown;
  _id?: unknown;
  id?: unknown;
  title?: unknown;
  subtitle?: unknown;
  description?: unknown;
  category?: unknown;
  level?: unknown;
  language?: unknown;
  price?: unknown;
  rating?: unknown;
  enrolled?: unknown;
  instructor?: { name?: unknown } | null;
  instructorName?: unknown;
  thumbnailUrl?: unknown;
  outcomes?: unknown;
  requirements?: unknown;
  sections?: unknown;
  totalVideoSec?: unknown;
  updatedAt?: unknown;
};

const asObject = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

const pickCourseItem = (payload: unknown): RawCourse | null => {
  const outer = asObject(payload);
  if (!outer) return null;
  const item = asObject(outer.item);
  return (item ?? outer) as RawCourse;
};

const toLectureType = (raw: unknown): LectureKind => {
  const normalized = String(raw ?? "").toLowerCase();
  if (normalized === "video") return "Video";
  if (normalized === "file") return "File";
  if (normalized === "quiz") return "Quiz";
  return "Note";
};

const formatMin = (min: number): string => {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
  }
  return `${min} min`;
};

const lessonIcon = (type: LectureKind) => {
  if (type === "Video") return <FiPlayCircle className="h-4 w-4" />;
  if (type === "File") return <FiPaperclip className="h-4 w-4" />;
  if (type === "Note") return <FiFileText className="h-4 w-4" />;
  return <FiHelpCircle className="h-4 w-4" />;
};

const toUiCourse = (payload: unknown): CourseUiModel | null => {
  const c = pickCourseItem(payload);
  if (!c) return null;

  const sectionsRaw: RawSection[] = Array.isArray(c.sections) ? (c.sections as RawSection[]) : [];

  const sections: UiSection[] = sectionsRaw.map((s: RawSection, idx: number) => {
    const lecturesRaw: RawLecture[] = Array.isArray(s.lectures) ? (s.lectures as RawLecture[]) : [];

    const lectures: UiLecture[] = lecturesRaw.map((l: RawLecture, lectureIdx: number) => ({
      id: String(l._id ?? l.id ?? `${idx + 1}-${lectureIdx + 1}`),
      title: String(l.title ?? "Untitled lecture"),
      type: toLectureType(l.type),
      durationMin: Math.max(0, Math.round(Number(l.durationSec ?? 0) / 60)),
      isPreview: Boolean(l.isFreePreview ?? l.isPreview),
    }));

    return {
      id: String(s._id ?? s.id ?? idx + 1),
      title: String(s.title ?? `Section ${idx + 1}`),
      lectures,
    };
  });

  const lessons = sections.reduce((acc, s) => acc + s.lectures.length, 0);
  const totalVideoSec = Number(c.totalVideoSec ?? 0);
  const hours = Math.max(0, Math.round((totalVideoSec / 3600) * 10) / 10);

  const fallbackOutcomes = [
    "Understand the core concepts step by step",
    "Practice with guided examples and explanations",
    "Build confidence through quizzes and revision",
  ];
  const fallbackRequirements = [
    "Basic familiarity with the subject",
    "A notebook and regular practice time",
    "Internet connection to access course materials",
  ];

  const outcomesRaw = Array.isArray(c.outcomes) ? c.outcomes : [];
  const requirementsRaw = Array.isArray(c.requirements) ? c.requirements : [];

  const outcomes =
    outcomesRaw.length > 0
      ? outcomesRaw.map((x: unknown) => String(x)).filter(Boolean)
      : fallbackOutcomes;

  const requirements =
    requirementsRaw.length > 0
      ? requirementsRaw.map((x: unknown) => String(x)).filter(Boolean)
      : fallbackRequirements;

  const thumb =
    typeof c.thumbnailUrl === "string" && c.thumbnailUrl.trim()
      ? c.thumbnailUrl
      : "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1600&q=60";

  return {
    id: String(c._id ?? c.id ?? ""),
    title: String(c.title ?? "Untitled Course"),
    subtitle: String(c.subtitle ?? ""),
    description: String(c.description ?? "No description provided yet."),
    category: String(c.category ?? "General"),
    level: String(c.level ?? "All Levels"),
    language: String(c.language ?? "English"),
    priceType: Number(c.price ?? 0) > 0 ? "Paid" : "Free",
    priceNpr: Number(c.price ?? 0),
    rating: Number(c.rating ?? 4.5),
    hours,
    lessons,
    enrolled: Number(c.enrolled ?? 0),
    instructorName: String(c.instructor?.name ?? c.instructorName ?? "Instructor"),
    thumbnailUrl: thumb,
    outcomes,
    requirements,
    sections,
    updatedAt: typeof c.updatedAt === "string" ? c.updatedAt : undefined,
  };
};

const CourseDetailsPage = () => {
  const { id } = useParams<{ id: string }>();

  const [course, setCourse] = useState<CourseUiModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const data = await coursesApi.getById(id);
        const mappedCourse = toUiCourse(data);

        if (!cancelled) {
          setCourse(mappedCourse);
          setOpenSections(
            mappedCourse
              ? mappedCourse.sections.reduce<Record<string, boolean>>((acc, s, idx) => {
                  acc[s.id] = idx === 0;
                  return acc;
                }, {})
              : {}
          );
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load course details";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const totalPreviewLectures = useMemo(() => {
    if (!course) return 0;
    return course.sections.reduce(
      (acc, s) => acc + s.lectures.filter((l) => l.isPreview).length,
      0
    );
  }, [course]);

  const curriculumMinutes = useMemo(() => {
    if (!course) return 0;
    return course.sections.reduce(
      (acc, s) => acc + s.lectures.reduce((sum, l) => sum + l.durationMin, 0),
      0
    );
  }, [course]);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold text-gray-900">Loading course...</p>
        <p className="mt-2 text-sm text-gray-600">Please wait a moment.</p>
      </div>
    );
  }

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

  if (!course) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="text-lg font-semibold text-gray-900">Course not found</p>
        <p className="mt-2 text-sm text-gray-600">The course you are trying to open does not exist.</p>
        <Link
          to="/courses"
          className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Back to Courses
        </Link>
      </div>
    );
  }

  const priceText = course.priceType === "Free" ? "Free" : `NPR ${course.priceNpr.toLocaleString()}`;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 text-white">
        <img
          src={course.thumbnailUrl}
          alt={course.title}
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-900/70" />

        <div className="relative grid gap-6 p-8 lg:grid-cols-12 lg:p-10">
          <div className="space-y-5 lg:col-span-8">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-indigo-100 ring-1 ring-indigo-300/30">
                {course.category}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-white ring-1 ring-white/20">
                {course.level}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-white ring-1 ring-white/20">
                {course.language}
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">{course.title}</h1>
              {course.subtitle ? <p className="mt-3 text-sm text-gray-200 sm:text-base">{course.subtitle}</p> : null}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-100">
              <span className="inline-flex items-center gap-2">
                <FiStar className="h-4 w-4 text-yellow-300" />
                {course.rating.toFixed(1)} rating
              </span>
              <span className="inline-flex items-center gap-2">
                <FiUsers className="h-4 w-4" />
                {course.enrolled.toLocaleString()} students
              </span>
              <span className="inline-flex items-center gap-2">
                <FiBookOpen className="h-4 w-4" />
                {course.lessons} lectures
              </span>
              <span className="inline-flex items-center gap-2">
                <FiClock className="h-4 w-4" />
                {course.hours} total hours
              </span>
            </div>

            <p className="text-sm text-gray-300">
              Created by <span className="font-semibold text-white">{course.instructorName}</span>
              {course.updatedAt ? ` • Last updated ${new Date(course.updatedAt).toLocaleDateString()}` : ""}
            </p>
          </div>

          <aside className="lg:col-span-4">
            <div className="rounded-2xl bg-white p-5 text-gray-900 shadow-2xl ring-1 ring-black/5">
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="h-40 w-full rounded-xl object-cover"
              />

              <div className="mt-4 flex items-end justify-between">
                <p className="text-3xl font-extrabold">{priceText}</p>
                {course.priceType === "Free" ? (
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                    Free Access
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setIsEnrolled(true)}
                className={[
                  "mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition",
                  isEnrolled ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700",
                ].join(" ")}
              >
                {isEnrolled ? "You are enrolled" : course.priceType === "Free" ? "Enroll for Free" : "Buy Now"}
              </button>

              <Link
                to="/questions"
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Ask a Question
              </Link>

              <div className="mt-5 space-y-3 text-sm text-gray-700">
                <p className="inline-flex items-center gap-2">
                  <FiCheckCircle className="h-4 w-4 text-green-600" />
                  {course.lessons} on-demand lectures
                </p>
                <p className="inline-flex items-center gap-2">
                  <FiClock className="h-4 w-4 text-green-600" />
                  {formatMin(curriculumMinutes)} of content
                </p>
                <p className="inline-flex items-center gap-2">
                  <FiShield className="h-4 w-4 text-green-600" />
                  {totalPreviewLectures} free preview lessons
                </p>
                <p className="inline-flex items-center gap-2">
                  <FiGlobe className="h-4 w-4 text-green-600" />
                  Language: {course.language}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <main className="space-y-6 lg:col-span-8">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">What you'll learn</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {course.outcomes.map((item, idx) => (
                <p key={`${item}-${idx}`} className="inline-flex items-start gap-2 text-sm text-gray-700">
                  <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <span>{item}</span>
                </p>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Course Description</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-700">{course.description}</p>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Curriculum</h2>
            <p className="mt-2 text-sm text-gray-600">
              {course.sections.length} sections • {course.lessons} lectures • {formatMin(curriculumMinutes)} total length
            </p>

            <div className="mt-5 space-y-3">
              {course.sections.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                  Curriculum is not available yet.
                </p>
              ) : (
                course.sections.map((section, idx) => {
                  const isOpen = Boolean(openSections[section.id]);
                  const secMinutes = section.lectures.reduce((sum, l) => sum + l.durationMin, 0);

                  return (
                    <div key={section.id} className="overflow-hidden rounded-xl border border-gray-200">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left hover:bg-gray-100"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            Section {idx + 1}: {section.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-600">
                            {section.lectures.length} lectures • {formatMin(secMinutes)}
                          </p>
                        </div>
                        {isOpen ? (
                          <FiChevronUp className="h-5 w-5 text-gray-700" />
                        ) : (
                          <FiChevronDown className="h-5 w-5 text-gray-700" />
                        )}
                      </button>

                      {isOpen ? (
                        <div className="divide-y divide-gray-100 bg-white">
                          {section.lectures.map((lecture) => (
                            <div key={lecture.id} className="flex items-center justify-between gap-4 px-4 py-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                                  {lessonIcon(lecture.type)}
                                </span>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-gray-900">{lecture.title}</p>
                                  <p className="mt-0.5 text-xs text-gray-500">{lecture.type}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                {lecture.isPreview ? (
                                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700 ring-1 ring-indigo-200">
                                    Preview
                                  </span>
                                ) : null}
                                <span>{lecture.durationMin > 0 ? `${lecture.durationMin} min` : "-"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Requirements</h2>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              {course.requirements.map((item, idx) => (
                <li key={`${item}-${idx}`} className="inline-flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </main>

        <aside className="space-y-6 lg:col-span-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">This course includes</h3>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <p className="inline-flex items-center gap-2">
                <FiPlayCircle className="h-4 w-4" />
                {course.lessons} lectures
              </p>
              <p className="inline-flex items-center gap-2">
                <FiClock className="h-4 w-4" />
                {course.hours} total hours
              </p>
              <p className="inline-flex items-center gap-2">
                <FiBarChart2 className="h-4 w-4" />
                Level: {course.level}
              </p>
              <p className="inline-flex items-center gap-2">
                <FiGlobe className="h-4 w-4" />
                Language: {course.language}
              </p>
              <p className="inline-flex items-center gap-2">
                <FiBookOpen className="h-4 w-4" />
                Category: {course.category}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Instructor</h3>
            <div className="mt-4 flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gray-900 text-sm font-bold text-white">
                {course.instructorName
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase())
                  .join("")}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{course.instructorName}</p>
                <p className="mt-1 text-xs text-gray-600">Verified Instructor</p>
              </div>
            </div>

            <Link
              to="/mentors"
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Find Mentor
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default CourseDetailsPage;
