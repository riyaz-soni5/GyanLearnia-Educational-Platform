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
  FiGlobe,
  FiHelpCircle,
  FiPaperclip,
  FiPlayCircle,
  FiShield,
  FiStar,
  FiUsers,
  FiX,
  FiAward,
} from "react-icons/fi";
import {
  coursesApi,
  type CourseCertificate,
  type CourseProgress,
  type CourseQuiz,
  type CourseQuizResult,
} from "@/app/api/courses.api";
import type { CourseListItem } from "@/app/types/course.type";

type LectureKind = "Video" | "Quiz" | "File";

type UiLecture = {
  id: string;
  title: string;
  type: LectureKind;
  durationMin: number;
  isPreview: boolean;
  quizId?: string;
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
  tags: string[];
  certificateEnabled: boolean;
  sections: UiSection[];
  updatedAt?: string;
};

type RelatedCourse = CourseListItem & {
  instructor?: { name?: string; email?: string };
  totalLectures?: number;
  totalVideoSec?: number;
};

type CourseListResponse = RelatedCourse[] | { items?: RelatedCourse[] };

type RawLecture = {
  _id?: unknown;
  id?: unknown;
  title?: unknown;
  type?: unknown;
  durationSec?: unknown;
  isFreePreview?: unknown;
  isPreview?: unknown;
  quizId?: unknown;
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
  instructor?: { name?: unknown; email?: unknown } | null;
  instructorName?: unknown;
  thumbnailUrl?: unknown;
  outcomes?: unknown;
  requirements?: unknown;
  tags?: unknown;
  certificate?: { enabled?: unknown } | null;
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

const toCourseRows = (payload: CourseListResponse): RelatedCourse[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const toLectureType = (raw: unknown): LectureKind => {
  const normalized = String(raw ?? "").toLowerCase();
  if (normalized === "video") return "Video";
  if (normalized === "file") return "File";
  if (normalized === "quiz") return "Quiz";
  return "File";
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
      quizId: l.quizId ? String(l.quizId) : undefined,
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

  const category = String(c.category ?? "General").trim() || "General";
  const rawLevel = String(c.level ?? "").trim();
  const level =
    category === "Academic"
      ? rawLevel || "Class 10 (SEE)"
      : rawLevel && rawLevel !== "Class 10 (SEE)"
      ? rawLevel
      : "All Levels";

  const instructorName =
    String(c.instructor?.name ?? c.instructor?.email ?? c.instructorName ?? "").trim() ||
    "Unknown Instructor";

  return {
    id: String(c._id ?? c.id ?? ""),
    title: String(c.title ?? "Untitled Course"),
    subtitle: String(c.subtitle ?? ""),
    description: String(c.description ?? "No description provided yet."),
    category,
    level,
    language: String(c.language ?? "English"),
    priceType: Number(c.price ?? 0) > 0 ? "Paid" : "Free",
    priceNpr: Number(c.price ?? 0),
    rating: Number(c.rating ?? 4.5),
    hours,
    lessons,
    enrolled: Number(c.enrolled ?? 0),
    instructorName,
    thumbnailUrl: thumb,
    outcomes,
    requirements,
    tags: Array.isArray(c.tags) ? c.tags.map((x: unknown) => String(x).trim()).filter(Boolean) : [],
    certificateEnabled: Boolean(c.certificate?.enabled),
    sections,
    updatedAt: typeof c.updatedAt === "string" ? c.updatedAt : undefined,
  };
};

const CourseDetailsPage = () => {
  const { id } = useParams<{ id: string }>();

  const [course, setCourse] = useState<CourseUiModel | null>(null);
  const [relatedCourses, setRelatedCourses] = useState<RelatedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizData, setQuizData] = useState<CourseQuiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<CourseQuizResult | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [markingLectureId, setMarkingLectureId] = useState<string>("");
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [actionError, setActionError] = useState("");

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

  const loadProgress = async (courseId: string) => {
    try {
      setProgressLoading(true);
      const res = await coursesApi.progress(courseId);
      setProgress(res.item);
      setIsEnrolled(Boolean(res.item.enrolled));
    } catch {
      setProgress(null);
    } finally {
      setProgressLoading(false);
    }
  };

  useEffect(() => {
    if (!course?.id) return;
    void loadProgress(course.id);
  }, [course?.id]);

  useEffect(() => {
    if (!course?.id) {
      setRelatedCourses([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = (await coursesApi.list()) as CourseListResponse;
        const rows = toCourseRows(data);
        const courseTagSet = new Set(course.tags.map((x) => x.toLowerCase()));

        const related = rows
          .filter((row) => row.id !== course.id)
          .map((row) => {
            const sameCategory = row.category === course.category ? 2 : 0;
            const sameLevel = row.level === course.level ? 2 : 0;

            const rowTags = Array.isArray((row as { tags?: unknown }).tags)
              ? ((row as { tags?: unknown }).tags as unknown[])
              : [];
            const overlap = rowTags.reduce<number>((acc, raw) => {
              const t = String(raw || "").trim().toLowerCase();
              return t && courseTagSet.has(t) ? acc + 1 : acc;
            }, 0);

            return {
              row,
              score: sameCategory + sameLevel + overlap,
            };
          })
          .filter((x) => x.score > 0 || x.row.category === course.category)
          .sort((a, b) => b.score - a.score)
          .slice(0, 4)
          .map((x) => x.row);

        if (!cancelled) setRelatedCourses(related);
      } catch {
        if (!cancelled) setRelatedCourses([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [course]);

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

  const reviews = useMemo(() => {
    if (!course) return [];

    const base = Math.max(1, Math.round(course.rating * 2));
    return [
      {
        id: "r1",
        name: "Student A",
        rating: Math.min(5, Math.max(3, base / 2)),
        text: `Clear explanation style for ${course.title}.`,
      },
      {
        id: "r2",
        name: "Student B",
        rating: Math.min(5, Math.max(3, course.rating)),
        text: `Curriculum is structured and easy to follow.`,
      },
      {
        id: "r3",
        name: "Student C",
        rating: Math.min(5, Math.max(3, course.rating - 0.3)),
        text: `Good for ${course.level} learners with practical coverage.`,
      },
    ];
  }, [course]);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const enrollCourse = async () => {
    if (!course) return;
    try {
      setActionError("");
      const res = await coursesApi.enroll(course.id);
      setIsEnrolled(true);
      setProgress(res.item);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Failed to enroll");
    }
  };

  const completeLecture = async (lectureId: string) => {
    if (!course) return;
    try {
      setActionError("");
      setMarkingLectureId(lectureId);
      const res = await coursesApi.completeLecture(course.id, lectureId);
      setProgress((prev) =>
        prev
          ? {
              ...prev,
              ...res.item,
              enrolled: true,
              quizScores: prev.quizScores,
              certificateEligible: res.item.isCompleted && course.certificateEnabled,
            }
          : {
              enrolled: true,
              completedCount: res.item.completedCount,
              totalCount: res.item.totalCount,
              percent: res.item.percent,
              isCompleted: res.item.isCompleted,
              completedLectureIds: res.item.completedLectureIds,
              quizScores: {},
              certificateEligible: res.item.isCompleted && course.certificateEnabled,
            }
      );
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Failed to mark lesson");
    } finally {
      setMarkingLectureId("");
    }
  };

  const openCertificate = async () => {
    if (!course) return;
    const win = window.open("", "_blank");
    if (!win) {
      setActionError("Popup blocked by browser. Please allow popups for this site.");
      return;
    }

    win.document.write(
      "<!doctype html><html><body style='font-family:Arial,sans-serif;padding:24px'>Generating certificate...</body></html>"
    );
    win.document.close();

    try {
      setActionError("");
      setCertificateLoading(true);
      const res = await coursesApi.getCertificate(course.id);
      const cert: CourseCertificate = res.item;
      win.document.open();
      win.document.write(cert.html);
      win.document.close();
    } catch (e: unknown) {
      win.close();
      setActionError(e instanceof Error ? e.message : "Failed to open certificate");
    } finally {
      setCertificateLoading(false);
    }
  };

  const openQuiz = async (lecture: UiLecture) => {
    if (!course || !lecture.quizId) return;
    if (!(lecture.isPreview || isEnrolled)) return;

    setQuizOpen(true);
    setQuizLoading(true);
    setQuizTitle(lecture.title);
    setQuizResult(null);
    setQuizAnswers({});

    try {
      const res = await coursesApi.getQuiz(course.id, lecture.quizId);
      setQuizData(res.item);
      setQuizAnswers(
        (res.item.questions || []).reduce<Record<string, string>>((acc, q) => {
          acc[q.id] = "";
          return acc;
        }, {})
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load quiz";
      setQuizData(null);
      setQuizResult(null);
      setActionError(msg);
      setQuizOpen(false);
    } finally {
      setQuizLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (!course || !quizData) return;
    setQuizSubmitting(true);
    try {
      setActionError("");
      const res = await coursesApi.submitQuiz(course.id, quizData.id, quizAnswers);
      setQuizResult(res.item);
      await loadProgress(course.id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to submit quiz";
      setActionError(msg);
    } finally {
      setQuizSubmitting(false);
    }
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
  const completedLectureSet = new Set(progress?.completedLectureIds ?? []);

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
            {actionError ? (
              <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {actionError}
              </p>
            ) : null}
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
                onClick={() => void enrollCourse()}
                disabled={progressLoading}
                className={[
                  "mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition",
                  isEnrolled
                    ? "bg-green-600 hover:bg-green-700"
                    : progressLoading
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-indigo-600 hover:bg-indigo-700",
                ].join(" ")}
              >
                {isEnrolled
                  ? "You are enrolled"
                  : progressLoading
                  ? "Please wait..."
                  : course.priceType === "Free"
                  ? "Enroll for Free"
                  : "Buy Now"}
              </button>

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

              {progress ? (
                <div className="mt-5 rounded-xl border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">Your Progress</p>
                    <p className="text-xs font-semibold text-gray-700">{progress.percent}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${progress.percent}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-gray-600">
                    {progress.completedCount}/{progress.totalCount} completed
                  </p>
                  {course.certificateEnabled ? (
                    <button
                      type="button"
                      onClick={() => void openCertificate()}
                      disabled={!progress.certificateEligible || certificateLoading}
                      className={[
                        "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold",
                        progress.certificateEligible && !certificateLoading
                          ? "bg-gray-900 text-white hover:bg-gray-800"
                          : "cursor-not-allowed border border-gray-300 bg-white text-gray-400",
                      ].join(" ")}
                    >
                      <FiAward className="h-4 w-4" />
                      {certificateLoading ? "Generating..." : "Get Certificate"}
                    </button>
                  ) : null}
                </div>
              ) : null}
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
                                {completedLectureSet.has(lecture.id) ? (
                                  <span className="rounded-full bg-green-50 px-2 py-0.5 font-semibold text-green-700 ring-1 ring-green-200">
                                    Completed
                                  </span>
                                ) : null}
                                {lecture.isPreview ? (
                                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700 ring-1 ring-indigo-200">
                                    Preview
                                  </span>
                                ) : null}
                                <span>{lecture.durationMin > 0 ? `${lecture.durationMin} min` : "-"}</span>
                                {lecture.type === "Quiz" ? (
                                  <button
                                    type="button"
                                    onClick={() => void openQuiz(lecture)}
                                    disabled={!(lecture.isPreview || isEnrolled)}
                                    className={[
                                      "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition",
                                      lecture.isPreview || isEnrolled
                                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                        : "cursor-not-allowed border border-gray-300 bg-white text-gray-400",
                                    ].join(" ")}
                                  >
                                    Start Quiz
                                  </button>
                                ) : isEnrolled ? (
                                  <button
                                    type="button"
                                    onClick={() => void completeLecture(lecture.id)}
                                    disabled={completedLectureSet.has(lecture.id) || markingLectureId === lecture.id}
                                    className={[
                                      "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition",
                                      completedLectureSet.has(lecture.id)
                                        ? "cursor-not-allowed border border-green-200 bg-green-50 text-green-700"
                                        : markingLectureId === lecture.id
                                        ? "cursor-not-allowed bg-gray-400 text-white"
                                        : "bg-gray-900 text-white hover:bg-gray-800",
                                    ].join(" ")}
                                  >
                                    {markingLectureId === lecture.id ? "Saving..." : "Mark Complete"}
                                  </button>
                                ) : null}
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
            <h2 className="text-xl font-bold text-gray-900">Course Description</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-700">{course.description}</p>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
            <div className="mt-4 space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{review.name}</p>
                    <p className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                      <FiStar className="h-3.5 w-3.5" />
                      {review.rating.toFixed(1)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{review.text}</p>
                </div>
              ))}
            </div>
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
              {course.certificateEnabled ? (
                <p className="inline-flex items-center gap-2">
                  <FiAward className="h-4 w-4" />
                  Completion certificate included
                </p>
              ) : null}
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
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Related Courses</h3>
            {relatedCourses.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">No related courses found right now.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {relatedCourses.map((item) => {
                  const teacher = item.instructor?.name?.trim() || item.instructor?.email?.trim() || "Instructor";
                  const priceText = Number(item.price || 0) > 0 ? `NPR ${Number(item.price).toLocaleString()}` : "Free";
                  return (
                    <Link
                      key={item.id}
                      to={`/courses/${item.id}`}
                      className="block rounded-xl border border-gray-200 p-3 hover:bg-gray-50"
                    >
                      <p className="line-clamp-2 text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-xs text-gray-600">By {teacher}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.category} • {item.level}
                      </p>
                      <p className="mt-2 text-sm font-bold text-gray-900">{priceText}</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </aside>
      </div>

      {quizOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <div>
                <p className="text-xs font-semibold text-gray-500">Quiz</p>
                <h3 className="text-lg font-bold text-gray-900">{quizData?.title || quizTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (quizSubmitting) return;
                  setQuizOpen(false);
                }}
                className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto p-4">
              {quizLoading ? (
                <p className="text-sm text-gray-600">Loading quiz...</p>
              ) : !quizData ? (
                <p className="text-sm text-red-600">Quiz unavailable.</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-gray-600">
                    Pass mark: <span className="font-semibold">{quizData.passPercent}%</span>
                  </p>

                  {quizData.questions.map((q, qIdx) => (
                    <div key={q.id} className="rounded-xl border border-gray-200 p-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {qIdx + 1}. {q.prompt}
                      </p>

                      <div className="mt-3 space-y-2">
                        {q.options.map((opt) => {
                          const detail = quizResult?.details.find((d) => d.questionId === q.id);
                          const isSelected = quizAnswers[q.id] === opt.id;
                          const isCorrectOpt = detail?.correctOptionId === opt.id;
                          const reveal = Boolean(quizResult);

                          return (
                            <label
                              key={opt.id}
                              className={[
                                "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                                reveal && isCorrectOpt
                                  ? "border-green-300 bg-green-50"
                                  : reveal && isSelected && !isCorrectOpt
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300 bg-white",
                              ].join(" ")}
                            >
                              <input
                                type="radio"
                                name={`quiz-${q.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  !quizResult && setQuizAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                                }
                                disabled={Boolean(quizResult)}
                              />
                              <span>{opt.text}</span>
                            </label>
                          );
                        })}
                      </div>

                      {quizResult ? (
                        <p className="mt-2 text-xs text-gray-600">
                          {quizResult.details.find((d) => d.questionId === q.id)?.explanation || "No explanation."}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-4">
              {quizResult ? (
                <div className="mb-3 rounded-xl bg-gray-50 p-3 text-sm">
                  <p className="font-semibold text-gray-900">
                    Score: {quizResult.scorePercent}% ({quizResult.correctCount}/{quizResult.totalQuestions})
                  </p>
                  <p className={quizResult.passed ? "text-green-700" : "text-red-700"}>
                    {quizResult.passed ? "Passed" : "Failed"} (required {quizResult.passPercent}%)
                  </p>
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                {quizResult ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuizResult(null);
                      setQuizAnswers((quizData?.questions || []).reduce<Record<string, string>>((acc, q) => {
                        acc[q.id] = "";
                        return acc;
                      }, {}));
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                  >
                    Retry
                  </button>
                ) : null}

                {!quizResult ? (
                  <button
                    type="button"
                    onClick={() => void submitQuiz()}
                    disabled={quizSubmitting || !quizData}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    {quizSubmitting ? "Submitting..." : "Submit Quiz"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setQuizOpen(false)}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CourseDetailsPage;
