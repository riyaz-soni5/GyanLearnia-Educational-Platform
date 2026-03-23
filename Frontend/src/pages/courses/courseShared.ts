import type { CourseListItem } from "@/app/types/course.type";

export type LectureKind = "Video" | "Quiz" | "File";

export type UiLectureResource = {
  name: string;
  url: string;
  sizeBytes: number;
};

export type UiLecture = {
  id: string;
  title: string;
  type: LectureKind;
  durationMin: number;
  isPreview: boolean;
  quizId?: string;
  videoUrl?: string;
  resources: UiLectureResource[];
};

export type UiSection = {
  id: string;
  title: string;
  lectures: UiLecture[];
};

export type CourseUiModel = {
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
  instructorId?: string;
  instructorName: string;
  instructorAvatarUrl?: string | null;
  instructorBio?: string;
  instructorJoinedAt?: string;
  thumbnailUrl: string;
  outcomes: string[];
  requirements: string[];
  tags: string[];
  certificateEnabled: boolean;
  sections: UiSection[];
  updatedAt?: string;
};

export type RelatedCourse = CourseListItem & {
  instructor?: { name?: string; email?: string };
  totalLectures?: number;
  totalVideoSec?: number;
};

export type CourseListResponse = RelatedCourse[] | { items?: RelatedCourse[] };

type RawLecture = {
  _id?: unknown;
  id?: unknown;
  title?: unknown;
  type?: unknown;
  durationSec?: unknown;
  isFreePreview?: unknown;
  isPreview?: unknown;
  quizId?: unknown;
  videoUrl?: unknown;
  fileUrl?: unknown;
  resources?: unknown;
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
  instructor?: {
    id?: unknown;
    name?: unknown;
    email?: unknown;
    avatarUrl?: unknown;
    bio?: unknown;
    joinedAt?: unknown;
  } | null;
  instructorName?: unknown;
  thumbnailUrl?: unknown;
  outcomes?: unknown;
  requirements?: unknown;
  tags?: unknown;
  certificate?: { enabled?: unknown } | null;
  sections?: unknown;
  totalVideoSec?: unknown;
  updatedAt?: unknown;
  averageRating?: unknown;
  reviewsCount?: unknown;
};

type RawLectureResource = {
  name?: unknown;
  url?: unknown;
  sizeBytes?: unknown;
};

const asObject = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const resolveAssetUrl = (url?: string | null) => {
  if (!url) return null;
  const clean = String(url).trim();
  if (!clean) return null;
  if (/^https?:\/\//i.test(clean)) return clean;
  return `${API_BASE}${clean.startsWith("/") ? clean : `/${clean}`}`;
};

const pickCourseItem = (payload: unknown): RawCourse | null => {
  const outer = asObject(payload);
  if (!outer) return null;
  const item = asObject(outer.item);
  return (item ?? outer) as RawCourse;
};

export const toCourseRows = (payload: CourseListResponse): RelatedCourse[] => {
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

export const formatMin = (min: number): string => {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
  }
  return `${min} min`;
};

export const parseApiError = (error: unknown, fallback: string): string => {
  if (!(error instanceof Error)) return fallback;
  const raw = String(error.message || "").trim();
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as { message?: unknown; error?: unknown };
    if (typeof parsed.message === "string" && parsed.message.trim()) return parsed.message;
    if (typeof parsed.error === "string" && parsed.error.trim()) return parsed.error;
  } catch {
    // keep raw fallback
  }

  return raw;
};

export const toUiCourse = (payload: unknown): CourseUiModel | null => {
  const c = pickCourseItem(payload);
  if (!c) return null;

  const sectionsRaw: RawSection[] = Array.isArray(c.sections) ? (c.sections as RawSection[]) : [];

  const sections: UiSection[] = sectionsRaw.map((s: RawSection, idx: number) => {
    const lecturesRaw: RawLecture[] = Array.isArray(s.lectures) ? (s.lectures as RawLecture[]) : [];

    const lectures: UiLecture[] = lecturesRaw.map((l: RawLecture, lectureIdx: number) => {
      const lectureResourcesRaw = Array.isArray(l.resources) ? (l.resources as RawLectureResource[]) : [];
      const normalizedResources: UiLectureResource[] = lectureResourcesRaw
        .map((r, resourceIdx) => {
          const resolvedUrl = resolveAssetUrl(typeof r?.url === "string" ? r.url : "");
          if (!resolvedUrl) return null;
          return {
            name: String(r?.name ?? `Resource ${resourceIdx + 1}`).trim() || `Resource ${resourceIdx + 1}`,
            url: resolvedUrl,
            sizeBytes: Math.max(0, Number(r?.sizeBytes ?? 0)),
          };
        })
        .filter((r): r is UiLectureResource => Boolean(r));

      const legacyFileUrl = resolveAssetUrl(typeof l.fileUrl === "string" ? l.fileUrl : "");
      const resources =
        normalizedResources.length > 0
          ? normalizedResources
          : legacyFileUrl
            ? [{ name: "Resource", url: legacyFileUrl, sizeBytes: 0 }]
            : [];

      const videoUrl = resolveAssetUrl(typeof l.videoUrl === "string" ? l.videoUrl : "");

      return {
        id: String(l._id ?? l.id ?? `${idx + 1}-${lectureIdx + 1}`),
        title: String(l.title ?? "Untitled lecture"),
        type: toLectureType(l.type),
        durationMin: Math.max(0, Math.round(Number(l.durationSec ?? 0) / 60)),
        isPreview: Boolean(l.isFreePreview ?? l.isPreview),
        quizId: l.quizId ? String(l.quizId) : undefined,
        videoUrl: videoUrl ?? undefined,
        resources,
      };
    });

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
  const instructorId = String(c.instructor?.id ?? "").trim() || undefined;
  const instructorAvatarUrl =
    typeof c.instructor?.avatarUrl === "string" ? resolveAssetUrl(c.instructor.avatarUrl) : null;
  const instructorBio = String(c.instructor?.bio ?? "").trim() || undefined;
  const instructorJoinedAt =
    typeof c.instructor?.joinedAt === "string" ? c.instructor.joinedAt : undefined;

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
    rating: Number(c.averageRating ?? c.rating ?? 0),
    hours,
    lessons,
    enrolled: Number(c.enrolled ?? 0),
    instructorId,
    instructorName,
    instructorAvatarUrl,
    instructorBio,
    instructorJoinedAt,
    thumbnailUrl: thumb,
    outcomes,
    requirements,
    tags: Array.isArray(c.tags) ? c.tags.map((x: unknown) => String(x).trim()).filter(Boolean) : [],
    certificateEnabled: Boolean(c.certificate?.enabled),
    sections,
    updatedAt: typeof c.updatedAt === "string" ? c.updatedAt : undefined,
  };
};

export const flattenCourseLectures = (course: CourseUiModel | null | undefined): UiLecture[] => {
  if (!course) return [];
  return course.sections.flatMap((section) => section.lectures);
};

export const findLectureById = (
  course: CourseUiModel | null | undefined,
  lectureId: string | null | undefined
): UiLecture | null => {
  if (!course || !lectureId) return null;
  return flattenCourseLectures(course).find((lecture) => lecture.id === lectureId) ?? null;
};

export const pickInitialCourseLecture = (
  course: CourseUiModel | null | undefined,
  completedLectureIds: string[] = []
): UiLecture | null => {
  const lectures = flattenCourseLectures(course);
  if (lectures.length === 0) return null;

  const completedSet = new Set(completedLectureIds.map(String));
  const firstPendingTrackedLecture =
    lectures.find(
      (lecture) =>
        (lecture.type === "Video" || lecture.type === "Quiz") && !completedSet.has(lecture.id)
    ) ?? null;

  return firstPendingTrackedLecture ?? lectures[0] ?? null;
};
