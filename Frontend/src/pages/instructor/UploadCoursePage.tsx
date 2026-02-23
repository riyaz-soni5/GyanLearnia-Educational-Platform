// src/pages/instructor/UploadCoursePage.tsx
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiPlus, FiSave, FiTrash2, FiUploadCloud } from "react-icons/fi";

import { useToast } from "../../components/toast";
import {
  COURSE_CATEGORIES,
  COURSE_LEVELS,
  COURSE_SUBJECTS,
  type CourseDraft,
  type LessonDraft,
  type SectionDraft,
} from "../../app/types/course.type";
import ThumbnailUploadCard from "../../components/instructor/ThumbnailUploadCard";
import LessonCard from "../../components/instructor/LessonCard";
import CourseSubmissionStatusCard from "../../components/instructor/CourseSubmissionStatusCard";
import CourseCard from "../../components/courses/CourseCard";
import CertificateEditorCard from "../../components/instructor/CertificateEditorCard";

import {
  createCourse,
  getMyCourseById,
  listMyCourses,
  resubmitCourse,
  type MyInstructorCourse,
} from "../../services/instructorCourse";

const DRAFT_KEY = "gyanlearnia_course_draft_v1";

function newLesson(): LessonDraft {
  return {
    id: `l_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title: "",
    type: "Video",
    durationMin: 0,
    isPreview: false,
    resources: [],
  };
}

function newSection(seed = Date.now()): SectionDraft {
  return {
    id: `s_${seed}_${Math.floor(Math.random() * 1000)}`,
    title: "New Section",
    lessons: [newLesson()],
  };
}

function normalizeDraft(raw: unknown): CourseDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const draft = raw as Partial<CourseDraft>;

  const sectionsFromDraft = Array.isArray(draft.sections) ? draft.sections : [];
  const lessonsFromLegacy = Array.isArray(draft.lessons) ? draft.lessons : [];

  const normalizedSections: SectionDraft[] =
    sectionsFromDraft.length > 0
      ? sectionsFromDraft.map((s, idx) => ({
          id: s.id || `s_${idx + 1}`,
          title: s.title || `Section ${idx + 1}`,
          lessons: Array.isArray(s.lessons) && s.lessons.length > 0 ? s.lessons : [newLesson()],
        }))
      : [
          {
            id: "s_curriculum",
            title: "Curriculum",
            lessons: lessonsFromLegacy.length > 0 ? lessonsFromLegacy : [newLesson()],
          },
        ];

  return {
    title: String(draft.title ?? ""),
    subtitle: String(draft.subtitle ?? ""),
    level: (draft.level ?? "Class 10 (SEE)") as CourseDraft["level"],
    category: (draft.category ?? "Academic") as CourseDraft["category"],
    subject: (draft.subject ?? "Mathematics") as CourseDraft["subject"],
    tags: Array.isArray(draft.tags) ? draft.tags.map(String) : [],
    priceType: (draft.priceType ?? "Free") as CourseDraft["priceType"],
    priceNpr: Number(draft.priceNpr ?? 0),
    language: (draft.language ?? "English") as CourseDraft["language"],
    thumbnailUrl: draft.thumbnailUrl,
    description: String(draft.description ?? ""),
    outcomes: Array.isArray(draft.outcomes) && draft.outcomes.length > 0 ? draft.outcomes.map(String) : [""],
    requirements:
      Array.isArray(draft.requirements) && draft.requirements.length > 0 ? draft.requirements.map(String) : [""],
    sections: normalizedSections,
    certificate: {
      enabled: Boolean(draft.certificate?.enabled),
      templateImageUrl: draft.certificate?.templateImageUrl,
      nameXPercent: Number(draft.certificate?.nameXPercent ?? 50),
      nameYPercent: Number(draft.certificate?.nameYPercent ?? 55),
      nameFontSizePx: Number(draft.certificate?.nameFontSizePx ?? 42),
      nameColor: String(draft.certificate?.nameColor ?? "#111827"),
    },
  };
}

export default function UploadCoursePage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editCourseId = searchParams.get("edit")?.trim() || "";

  const [publishing, setPublishing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editingCourseStatus, setEditingCourseStatus] = useState<MyInstructorCourse["status"] | null>(null);
  const [reviewCourse, setReviewCourse] = useState<MyInstructorCourse | null>(null);
  const [tagInput, setTagInput] = useState("");

  const [draft, setDraft] = useState<CourseDraft>({
    title: "",
    subtitle: "",
    level: "Class 10 (SEE)",
    category: "Academic",
    subject: "Mathematics",
    tags: [],
    priceType: "Free",
    priceNpr: 0,
    language: "English",
    thumbnailUrl: undefined,
    description: "",
    outcomes: ["", "", ""],
    requirements: ["", ""],
    sections: [
      {
        id: "s_intro",
        title: "Introduction",
        lessons: [
          {
            id: "l_intro",
            title: "Course Overview",
            type: "Video",
            durationMin: 0,
            isPreview: true,
            resources: [],
          },
        ],
      },
    ],
    certificate: {
      enabled: false,
      templateImageUrl: undefined,
      nameXPercent: 50,
      nameYPercent: 55,
      nameFontSizePx: 42,
      nameColor: "#111827",
    },
  });

  useEffect(() => {
    if (editCourseId) return;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = normalizeDraft(JSON.parse(raw));
      if (parsed) setDraft(parsed);
    } catch {
      // ignore invalid local draft payload
    }
  }, [editCourseId]);

  useEffect(() => {
    if (!editCourseId) {
      setEditLoading(false);
      setEditingCourseStatus(null);
      return;
    }

    let cancelled = false;

    const loadEditableCourse = async () => {
      setEditLoading(true);
      try {
        const res = await getMyCourseById(editCourseId);
        if (cancelled) return;

        const parsed = normalizeDraft(res.item.draft);
        if (parsed) setDraft(parsed);

        setEditingCourseStatus(res.item.status);
        setReviewCourse({
          id: res.item.id,
          title: res.item.title || parsed?.title || "Course",
          subtitle: parsed?.subtitle || "",
          status: res.item.status,
          rejectionReason: res.item.rejectionReason ?? null,
          createdAt: res.item.createdAt,
          totalLectures: parsed?.sections.reduce((acc, section) => acc + section.lessons.length, 0) ?? 0,
          totalVideoSec:
            parsed?.sections
              .flatMap((section) => section.lessons)
              .filter((lesson) => lesson.type === "Video")
              .reduce((sum, lesson) => sum + Math.round(Number(lesson.durationMin || 0) * 60), 0) ?? 0,
        });
      } catch (e) {
        if (!cancelled) {
          showToast(getErrorMessage(e), "error");
          setEditingCourseStatus(null);
        }
      } finally {
        if (!cancelled) setEditLoading(false);
      }
    };

    void loadEditableCourse();

    return () => {
      cancelled = true;
    };
  }, [editCourseId, showToast]);

  useEffect(() => {
    if (editCourseId) return;
    void loadLatestReviewCourse();
  }, [editCourseId]);

  async function loadLatestReviewCourse() {
    try {
      const res = await listMyCourses();
      const latest = (res.items ?? []).find((c) => c.status !== "Published") ?? null;
      setReviewCourse(latest);
    } catch {
      setReviewCourse(null);
    }
  }

  const allLessons = useMemo(() => draft.sections.flatMap((s) => s.lessons), [draft.sections]);
  const previewCourse = useMemo(() => {
    const totalVideoSec = allLessons
      .filter((l) => l.type === "Video")
      .reduce((sum, l) => sum + Math.round(Number(l.durationMin || 0) * 60), 0);

    return {
      id: "preview-draft-course",
      title: draft.title.trim() || "Course Title",
      subtitle: draft.subtitle.trim() || "Course subtitle will appear here",
      thumbnailUrl:
        draft.thumbnailUrl ||
        "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=60",
      category: draft.category,
      level: draft.category === "Academic" ? draft.level : "All Levels",
      language: draft.language,
      price: draft.priceType === "Free" ? 0 : Number(draft.priceNpr || 0),
      currency: "NPR",
      instructor: { email: "Instructor (Preview)" },
      totalLectures: allLessons.length,
      totalVideoSec,
    };
  }, [allLessons, draft]);

  const isValid = useMemo(() => {
    const hasTitle = draft.title.trim().length >= 6;
    const hasSubtitle = draft.subtitle.trim().length >= 10;
    const hasDesc = draft.description.trim().length >= 30;

    const hasSections =
      Array.isArray(draft.sections) &&
      draft.sections.length > 0 &&
      draft.sections.every(
        (s) => s.title.trim().length >= 2 && Array.isArray(s.lessons) && s.lessons.length >= 1
      );

    const hasLessons =
      Array.isArray(allLessons) &&
      allLessons.length >= 1 &&
      allLessons.every((l) => l.title.trim().length >= 4);

    const paidOk = draft.priceType === "Free" || draft.priceNpr >= 50;
    const hasAcademicMeta = draft.category !== "Academic" || (Boolean(draft.level) && Boolean(draft.subject));
    const certificateOk = !draft.certificate?.enabled || Boolean(draft.certificate?.templateImageUrl);

    const videoOk = allLessons.every((l) => (l.type !== "Video" ? true : Boolean(l.videoUrl)));
    const fileOk = allLessons.every((l) => (l.type !== "File" ? true : (l.resources?.length ?? 0) > 0));

    return (
      hasTitle &&
      hasSubtitle &&
      hasDesc &&
      hasSections &&
      hasLessons &&
      paidOk &&
      hasAcademicMeta &&
      certificateOk &&
      videoOk &&
      fileOk
    );
  }, [draft, allLessons]);

  const addTag = (value: string) => {
    const v = value.trim();
    if (!v) return;
    if (draft.tags.includes(v)) return;
    if (draft.tags.length >= 12) {
      showToast("Maximum 12 tags allowed", "error");
      return;
    }
    setDraft((p) => ({ ...p, tags: [...p.tags, v] }));
  };

  const removeTag = (tag: string) => setDraft((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));

  const onTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    }
    if (e.key === "Backspace" && !tagInput && draft.tags.length) {
      setDraft((p) => ({ ...p, tags: p.tags.slice(0, p.tags.length - 1) }));
    }
  };

  const updateOutcome = (i: number, v: string) => {
    setDraft((p) => {
      const outcomes = [...p.outcomes];
      outcomes[i] = v;
      return { ...p, outcomes };
    });
  };

  const addOutcome = () => setDraft((p) => ({ ...p, outcomes: [...p.outcomes, ""] }));

  const removeOutcome = (idx: number) =>
    setDraft((p) => ({ ...p, outcomes: p.outcomes.filter((_, i) => i !== idx) }));

  const updateRequirement = (i: number, v: string) => {
    setDraft((p) => {
      const requirements = [...p.requirements];
      requirements[i] = v;
      return { ...p, requirements };
    });
  };

  const addRequirement = () => setDraft((p) => ({ ...p, requirements: [...p.requirements, ""] }));

  const removeRequirement = (idx: number) =>
    setDraft((p) => ({ ...p, requirements: p.requirements.filter((_, i) => i !== idx) }));

  const addSection = () =>
    setDraft((p) => ({
      ...p,
      sections: [...p.sections, newSection()],
    }));

  const updateSectionTitle = (sectionId: string, title: string) => {
    setDraft((p) => ({
      ...p,
      sections: p.sections.map((s) => (s.id === sectionId ? { ...s, title } : s)),
    }));
  };

  const removeSection = (sectionId: string) =>
    setDraft((p) => ({ ...p, sections: p.sections.filter((s) => s.id !== sectionId) }));

  const addLesson = (sectionId: string) =>
    setDraft((p) => ({
      ...p,
      sections: p.sections.map((s) => (s.id === sectionId ? { ...s, lessons: [...s.lessons, newLesson()] } : s)),
    }));

  const updateLesson = (sectionId: string, lessonId: string, patch: Partial<LessonDraft>) => {
    setDraft((p) => ({
      ...p,
      sections: p.sections.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          lessons: s.lessons.map((l) => {
            if (l.id !== lessonId) return l;
            const next = { ...l, ...patch };
            if (patch.type && patch.type !== "Video") {
              next.durationMin = 0;
              next.videoUrl = undefined;
            }
            if (patch.type && patch.type !== "File") {
              next.fileUrl = undefined;
              next.resources = [];
            }
            return next;
          }),
        };
      }),
    }));
  };

  const removeLesson = (sectionId: string, lessonId: string) =>
    setDraft((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s.id === sectionId ? { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) } : s
      ),
    }));

  const moveLesson = (sectionId: string, lessonId: string, dir: -1 | 1) => {
    setDraft((p) => ({
      ...p,
      sections: p.sections.map((s) => {
        if (s.id !== sectionId) return s;

        const idx = s.lessons.findIndex((l) => l.id === lessonId);
        if (idx < 0) return s;

        const nxt = idx + dir;
        if (nxt < 0 || nxt >= s.lessons.length) return s;

        const copy = [...s.lessons];
        const [item] = copy.splice(idx, 1);
        copy.splice(nxt, 0, item);

        return { ...s, lessons: copy };
      }),
    }));
  };

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    showToast("Draft saved", "success");
  };

  const loadDraft = () => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return showToast("No saved draft found", "info");
    try {
      const parsed = normalizeDraft(JSON.parse(raw));
      if (parsed) {
        setDraft(parsed);
        showToast("Draft loaded", "success");
      }
    } catch {
      showToast("Draft load failed", "error");
    }
  };

  function getErrorMessage(e: unknown) {
    if (typeof e === "string") return e;
    if (e && typeof e === "object" && "message" in e) {
      const msg = (e as { message?: unknown }).message;
      if (typeof msg === "string") return msg;
    }
    return "Publish failed";
  }

  async function publish() {
    if (publishing) return;

    if (!isValid) {
      showToast("Fill required fields and upload required lesson files/videos before publishing.", "error", {
        durationMs: 2600,
      });
      return;
    }

    setPublishing(true);

    try {
      const canResubmit = Boolean(editCourseId) && Boolean(editingCourseStatus);

      const cleanDraft: CourseDraft = {
        ...draft,
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        description: draft.description.trim(),
        thumbnailUrl: draft.thumbnailUrl ?? undefined,
        outcomes: draft.outcomes.map((x) => x.trim()).filter(Boolean),
        requirements: draft.requirements.map((x) => x.trim()).filter(Boolean),
        tags: draft.tags.map((x) => x.trim()).filter(Boolean),
        certificate: {
          enabled: Boolean(draft.certificate?.enabled),
          templateImageUrl: draft.certificate?.templateImageUrl,
          nameXPercent: Number(draft.certificate?.nameXPercent ?? 50),
          nameYPercent: Number(draft.certificate?.nameYPercent ?? 55),
          nameFontSizePx: Number(draft.certificate?.nameFontSizePx ?? 42),
          nameColor: String(draft.certificate?.nameColor ?? "#111827"),
        },
        priceNpr: draft.priceType === "Free" ? 0 : Number(draft.priceNpr || 0),
        sections: draft.sections.map((section) => ({
          ...section,
          title: section.title.trim(),
          lessons: section.lessons.map((l) => ({
            ...l,
            title: l.title.trim(),
            durationMin: l.type === "Video" ? Number(l.durationMin || 0) : 0,
            videoUrl: l.videoUrl ?? undefined,
            resources: l.type === "File" ? l.resources : [],
            fileUrl: l.type === "File" ? l.fileUrl ?? l.resources?.[0]?.url ?? undefined : undefined,
          })),
        })),
      };

      const res = canResubmit ? await resubmitCourse(editCourseId, cleanDraft) : await createCourse(cleanDraft);

      localStorage.removeItem(DRAFT_KEY);
      const createdId = (res as { item?: { id?: string; status?: string } })?.item?.id;
      const createdStatus = (res as { item?: { id?: string; status?: string } })?.item?.status;
      if (createdStatus) {
        setEditingCourseStatus(createdStatus as MyInstructorCourse["status"]);
      }
      if (createdId && createdStatus && createdStatus !== "Published") {
        setReviewCourse({
          id: createdId,
          title: cleanDraft.title,
          subtitle: cleanDraft.subtitle,
          status: createdStatus as MyInstructorCourse["status"],
          rejectionReason: null,
          createdAt: new Date().toISOString(),
          totalLectures: cleanDraft.sections.reduce((acc, s) => acc + s.lessons.length, 0),
          totalVideoSec: cleanDraft.sections
            .flatMap((s) => s.lessons)
            .filter((x) => x.type === "Video")
            .reduce((sum, x) => sum + Math.round((x.durationMin || 0) * 60), 0),
        });
      } else {
        await loadLatestReviewCourse();
      }

      if (canResubmit) {
        navigate("/instructor/upload-course", { replace: true });
        showToast("Course updated and resubmitted ✅", "success");
      } else {
        showToast("Submitted to admin for approval ✅", "success");
      }
    } catch (e) {
      showToast(getErrorMessage(e), "error");
    } finally {
      setPublishing(false);
    }
  }

  const canResubmit = Boolean(editCourseId) && Boolean(editingCourseStatus);
  const publishDisabled = !isValid || publishing || editLoading;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">Upload Course</h1>
            {canResubmit ? (
              <p className="mt-1 text-sm text-amber-700">Editing existing course and preparing updated submission.</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadDraft}
              disabled={publishing}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            >
              <FiUploadCloud className="h-4 w-4" />
              Load Draft
            </button>

            <button
              type="button"
              onClick={saveDraft}
              disabled={publishing}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            >
              <FiSave className="h-4 w-4" />
              Save Draft
            </button>

            <button
              type="button"
              onClick={publish}
              disabled={publishDisabled}
              className={[
                "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition",
                publishDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700",
              ].join(" ")}
            >
              {publishing ? (canResubmit ? "Resubmitting..." : "Publishing...") : canResubmit ? "Resubmit" : "Publish"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
            </div>
            <div className="mt-6 grid gap-4">
              <div>
                <label className="text-xs font-medium text-gray-700">Course Title *</label>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Mathematics (Class 10 - SEE)"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <p className="mt-1 text-xs text-gray-500">Min 6 characters</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Subtitle *</label>
                <input
                  value={draft.subtitle}
                  onChange={(e) => setDraft((p) => ({ ...p, subtitle: e.target.value }))}
                  placeholder="e.g., Algebra + Geometry + Trigonometry — exam-focused practice"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <p className="mt-1 text-xs text-gray-500">Min 10 characters</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-gray-700">Category</label>
                  <select
                    value={draft.category}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        category: e.target.value as CourseDraft["category"],
                      }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    {COURSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {draft.category === "Academic" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Level</label>
                    <select
                      value={draft.level}
                      onChange={(e) => setDraft((p) => ({ ...p, level: e.target.value as CourseDraft["level"] }))}
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      {COURSE_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700">Subject</label>
                    <select
                      value={draft.subject}
                      onChange={(e) => setDraft((p) => ({ ...p, subject: e.target.value as CourseDraft["subject"] }))}
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      {COURSE_SUBJECTS.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-gray-700">Language</label>
                  <select
                    value={draft.language}
                    onChange={(e) => setDraft((p) => ({ ...p, language: e.target.value as CourseDraft["language"] }))}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option>English</option>
                    <option>Nepali</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Tags</label>
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100">
                  {draft.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-indigo-500 hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={onTagKeyDown}
                    placeholder="Type tag and press Enter"
                    className="min-w-[140px] flex-1 border-none bg-transparent text-sm focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Press Enter to add tags (max 12).</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-gray-700">Price Type</label>
                  <select
                    value={draft.priceType}
                    onChange={(e) => {
                      const next = e.target.value as CourseDraft["priceType"];
                      setDraft((p) => ({
                        ...p,
                        priceType: next,
                        priceNpr: next === "Free" ? 0 : p.priceNpr > 0 ? p.priceNpr : 500,
                      }));
                    }}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option>Free</option>
                    <option>Paid</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">Price (NPR)</label>
                  <input
                    type="number"
                    value={draft.priceType === "Free" ? 0 : draft.priceNpr > 0 ? draft.priceNpr : ""}
                    onChange={(e) => setDraft((p) => ({ ...p, priceNpr: Number(e.target.value || 0) }))}
                    disabled={draft.priceType === "Free"}
                    min={0}
                    placeholder={draft.priceType === "Free" ? "0" : "e.g. 500"}
                    className={[
                      "mt-2 w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2",
                      draft.priceType === "Free"
                        ? "border-gray-200 bg-gray-50 text-gray-400"
                        : "border-gray-300 focus:border-indigo-600 focus:ring-indigo-100",
                    ].join(" ")}
                  />
                </div>
              </div>
            </div>
          </section>

          <CertificateEditorCard
            value={
              draft.certificate || {
                enabled: false,
                templateImageUrl: undefined,
                nameXPercent: 50,
                nameYPercent: 55,
                nameFontSizePx: 42,
                nameColor: "#111827",
              }
            }
            onChange={(next) => setDraft((p) => ({ ...p, certificate: next }))}
          />

          <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Course Description</h2>
              <p className="mt-1 text-sm text-gray-600">Explain what students get and how it helps.</p>
            </div>

            <textarea
              value={draft.description}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              rows={6}
              placeholder="Write a detailed description (min 30 chars)."
              className="mt-6 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">Outcomes</p>
                  <button
                    type="button"
                    onClick={addOutcome}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-100"
                  >
                    <FiPlus className="h-4 w-4" /> Add
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {draft.outcomes.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={v}
                        onChange={(e) => updateOutcome(i, e.target.value)}
                        placeholder={`Outcome ${i + 1}`}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                      <button
                        type="button"
                        onClick={() => removeOutcome(i)}
                        disabled={draft.outcomes.length <= 1}
                        className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">Requirements</p>
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-100"
                  >
                    <FiPlus className="h-4 w-4" /> Add
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {draft.requirements.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={v}
                        onChange={(e) => updateRequirement(i, e.target.value)}
                        placeholder={`Requirement ${i + 1}`}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                      <button
                        type="button"
                        onClick={() => removeRequirement(i)}
                        disabled={draft.requirements.length <= 1}
                        className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Curriculum</h2>
                <p className="mt-1 text-sm text-gray-600">Create sections and add Video/File/Quiz.</p>
              </div>

              <button
                type="button"
                onClick={addSection}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <FiPlus className="h-4 w-4" />
                Add Section
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {draft.sections.map((section, sectionIdx) => (
                <div key={section.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-700">Section {sectionIdx + 1} Title *</label>
                      <input
                        value={section.title}
                        onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        placeholder="e.g., Algebra Basics"
                      />
                    </div>

                    <div className="flex items-center self-end gap-2">
                      <button
                        type="button"
                        onClick={() => addLesson(section.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                      >
                        <FiPlus className="h-4 w-4" />
                        Add Item
                      </button>

                      <button
                        type="button"
                        onClick={() => removeSection(section.id)}
                        disabled={draft.sections.length <= 1}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <FiTrash2 className="h-4 w-4" />
                        Remove Section
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {section.lessons.map((l, idx) => (
                      <LessonCard
                        key={l.id}
                        lesson={l}
                        index={idx}
                        isFirst={idx === 0}
                        isLast={idx === section.lessons.length - 1}
                        onChange={(patch) => updateLesson(section.id, l.id, patch)}
                        onRemove={() => removeLesson(section.id, l.id)}
                        onMove={(dir) => moveLesson(section.id, l.id, dir)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          {reviewCourse ? (
            <CourseSubmissionStatusCard
              course={reviewCourse}
              onEdit={(courseId) => navigate(`/instructor/upload-course?edit=${courseId}`)}
            />
          ) : null}

          <ThumbnailUploadCard
            thumbnailUrl={draft.thumbnailUrl}
            onChange={(url) => setDraft((p) => ({ ...p, thumbnailUrl: url }))}
          />

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Preview</h3>
            <div className="mt-3">
              <CourseCard course={previewCourse} previewMode />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
