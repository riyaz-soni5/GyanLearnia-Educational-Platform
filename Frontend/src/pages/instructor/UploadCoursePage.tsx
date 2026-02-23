// src/pages/instructor/UploadCoursePage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiSave, FiUploadCloud } from "react-icons/fi";

import { useToast } from "../../components/toast";
import type { CourseDraft, LessonDraft } from "../../app/types/course.type";
import ThumbnailUploadCard from "../../components/instructor/ThumbnailUploadCard";
import LessonCard from "../../components/instructor/LessonCard";
import CourseSubmissionStatusCard from "../../components/instructor/CourseSubmissionStatusCard";

import { createCourse, listMyCourses, type MyInstructorCourse } from "../../services/instructorCourse";

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

export default function UploadCoursePage() {
  const { showToast } = useToast();

  const [publishing, setPublishing] = useState(false);
  const [reviewCourse, setReviewCourse] = useState<MyInstructorCourse | null>(null);

  const [draft, setDraft] = useState<CourseDraft>({
    title: "",
    subtitle: "",
    level: "Class 10 (SEE)",
    category: "Academic",
    subject: "Mathematics",
    priceType: "Free",
    priceNpr: 0,
    language: "English",
    thumbnailUrl: undefined,
    description: "",
    outcomes: ["", "", ""],
    requirements: ["", ""],
    lessons: [
      {
        id: "l_intro",
        title: "Introduction / Course Overview",
        type: "Video",
        durationMin: 0,
        isPreview: true,
        resources: [],
      },
    ],
  });

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      setDraft(JSON.parse(raw));
    } catch {
      // ignore invalid local draft payload
    }
  }, []);

  useEffect(() => {
    void loadLatestReviewCourse();
  }, []);

  async function loadLatestReviewCourse() {
    try {
      const res = await listMyCourses();
      const latest = (res.items ?? []).find((c) => c.status !== "Published") ?? null;
      setReviewCourse(latest);
    } catch {
      setReviewCourse(null);
    }
  }

  const isValid = useMemo(() => {
    const hasTitle = draft.title.trim().length >= 6;
    const hasSubtitle = draft.subtitle.trim().length >= 10;
    const hasDesc = draft.description.trim().length >= 30;

    const hasLessons =
      Array.isArray(draft.lessons) &&
      draft.lessons.length >= 1 &&
      draft.lessons.every((l) => l.title.trim().length >= 4);

    const paidOk = draft.priceType === "Free" || (draft.priceNpr !== undefined && draft.priceNpr >= 50);

    // strict: every Video lesson must have videoUrl
    const videoOk =
      Array.isArray(draft.lessons) &&
      draft.lessons.every((l) => (l.type !== "Video" ? true : Boolean(l.videoUrl)));

    const fileOk =
      Array.isArray(draft.lessons) &&
      draft.lessons.every((l) => (l.type !== "File" ? true : (l.resources?.length ?? 0) > 0 || Boolean(l.fileUrl)));

    return hasTitle && hasSubtitle && hasDesc && hasLessons && paidOk && videoOk && fileOk;
  }, [draft]);

  const updateOutcome = (i: number, v: string) => {
    setDraft((p) => {
      const outcomes = [...p.outcomes];
      outcomes[i] = v;
      return { ...p, outcomes };
    });
  };

  const updateRequirement = (i: number, v: string) => {
    setDraft((p) => {
      const requirements = [...p.requirements];
      requirements[i] = v;
      return { ...p, requirements };
    });
  };

  const addLesson = () => setDraft((p) => ({ ...p, lessons: [...p.lessons, newLesson()] }));

  const updateLesson = (id: string, patch: Partial<LessonDraft>) => {
    setDraft((p) => ({
      ...p,
      lessons: p.lessons.map((l) => {
        if (l.id !== id) return l;

        const next = { ...l, ...patch };
        if (patch.type && patch.type !== "Video") {
          next.durationMin = 0;
          next.videoUrl = undefined;
        }
        if (patch.type && patch.type !== "Note") {
          next.noteText = undefined;
        }
        if (patch.type && patch.type !== "File") {
          next.fileUrl = undefined;
        }

        return next;
      }),
    }));
  };

  const removeLesson = (id: string) =>
    setDraft((p) => ({ ...p, lessons: p.lessons.filter((l) => l.id !== id) }));

  const moveLesson = (id: string, dir: -1 | 1) => {
    setDraft((p) => {
      const idx = p.lessons.findIndex((l) => l.id === id);
      if (idx < 0) return p;
      const nxt = idx + dir;
      if (nxt < 0 || nxt >= p.lessons.length) return p;

      const copy = [...p.lessons];
      const [item] = copy.splice(idx, 1);
      copy.splice(nxt, 0, item);
      return { ...p, lessons: copy };
    });
  };

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    showToast("Draft saved", "success");
  };

  const loadDraft = () => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return showToast("No saved draft found", "info");
    try {
      setDraft(JSON.parse(raw));
      showToast("Draft loaded", "success");
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
      // ✅ send draft exactly (because backend validates draft.lessons)
      const cleanDraft: CourseDraft = {
        ...draft,
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        description: draft.description.trim(),
        thumbnailUrl: draft.thumbnailUrl ?? undefined,
        priceNpr: draft.priceType === "Free" ? 0 : Number(draft.priceNpr || 0),
        lessons: draft.lessons.map((l) => ({
          ...l,
          title: l.title.trim(),
          durationMin: l.type === "Video" ? Number(l.durationMin || 0) : 0,
          videoUrl: l.videoUrl ?? undefined,
          fileUrl: l.fileUrl ?? l.resources?.[0]?.url ?? undefined,
        })),
      };

      const res = await createCourse(cleanDraft);

      localStorage.removeItem(DRAFT_KEY);
      const createdId = (res as { item?: { id?: string; status?: string } })?.item?.id;
      const createdStatus = (res as { item?: { id?: string; status?: string } })?.item?.status;
      if (createdId && createdStatus && createdStatus !== "Published") {
        setReviewCourse({
          id: createdId,
          title: cleanDraft.title,
          subtitle: cleanDraft.subtitle,
          status: createdStatus as MyInstructorCourse["status"],
          rejectionReason: null,
          createdAt: new Date().toISOString(),
          totalLectures: cleanDraft.lessons.length,
          totalVideoSec: cleanDraft.lessons
            .filter((x) => x.type === "Video")
            .reduce((sum, x) => sum + Math.round((x.durationMin || 0) * 60), 0),
        });
      } else {
        await loadLatestReviewCourse();
      }

      showToast("Submitted to admin for approval ✅", "success");
    } catch (e) {
      showToast(getErrorMessage(e), "error");
    } finally {
      setPublishing(false);
    }
  }

  const publishDisabled = !isValid || publishing;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">Upload Course</h1>
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
              {publishing ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main */}
        <div className="space-y-6 lg:col-span-8">
          {/* Basic */}
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
                  <label className="text-xs font-medium text-gray-700">Level</label>
                  <select
                    value={draft.level}
                    onChange={(e) => setDraft((p) => ({ ...p, level: e.target.value as CourseDraft["level"] }))}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option>Class 8</option>
                    <option>Class 9</option>
                    <option>Class 10 (SEE)</option>
                    <option>+2</option>
                    <option>Skill</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">Category</label>
                  <select
                    value={draft.category}
                    onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value as CourseDraft["category"] }))}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option>Academic</option>
                    <option>Technical</option>
                    <option>Vocational</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">Subject</label>
                  <select
                    value={draft.subject}
                    onChange={(e) => setDraft((p) => ({ ...p, subject: e.target.value as CourseDraft["subject"] }))}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option>Mathematics</option>
                    <option>Science</option>
                    <option>Physics</option>
                    <option>Chemistry</option>
                    <option>Biology</option>
                    <option>English</option>
                    <option>Nepali</option>
                    <option>Accountancy</option>
                    <option>Economics</option>
                    <option>Computer Science</option>
                    <option>Business Studies</option>
                    <option>Other</option>
                  </select>
                </div>

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
                  <p className="mt-1 text-xs text-gray-500">If paid: NPR 50+.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Description */}
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
                <p className="text-sm font-semibold text-gray-900">Outcomes</p>
                <div className="mt-4 space-y-3">
                  {draft.outcomes.map((v, i) => (
                    <input
                      key={i}
                      value={v}
                      onChange={(e) => updateOutcome(i, e.target.value)}
                      placeholder={`Outcome ${i + 1}`}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 p-6">
                <p className="text-sm font-semibold text-gray-900">Requirements</p>
                <div className="mt-4 space-y-3">
                  {draft.requirements.map((v, i) => (
                    <input
                      key={i}
                      value={v}
                      onChange={(e) => updateRequirement(i, e.target.value)}
                      placeholder={`Requirement ${i + 1}`}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Curriculum */}
          <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Curriculum</h2>
                <p className="mt-1 text-sm text-gray-600">Add lessons in order. Upload videos and resources.</p>
              </div>

              <button
                type="button"
                onClick={addLesson}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <FiPlus className="h-4 w-4" />
                Add Lesson
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {draft.lessons.map((l, idx) => (
                <LessonCard
                  key={l.id}
                  lesson={l}
                  index={idx}
                  isFirst={idx === 0}
                  isLast={idx === draft.lessons.length - 1}
                  onChange={(patch) => updateLesson(l.id, patch)}
                  onRemove={() => removeLesson(l.id)}
                  onMove={(dir) => moveLesson(l.id, dir)}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:col-span-4">
          {reviewCourse ? <CourseSubmissionStatusCard course={reviewCourse} /> : null}

          <ThumbnailUploadCard
            thumbnailUrl={draft.thumbnailUrl}
            onChange={(url) => setDraft((p) => ({ ...p, thumbnailUrl: url }))}
          />

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Preview</h3>
            <p className="mt-2 text-sm text-gray-600">How it may appear in listing.</p>

            <div className="mt-5 rounded-2xl bg-gray-50 p-5">
              <p className="text-xs font-semibold text-gray-500">
                {draft.category} • {draft.level} • {draft.subject}
              </p>
              <p className="mt-2 text-lg font-bold text-gray-900">{draft.title.trim() ? draft.title : "Course Title"}</p>
              <p className="mt-2 text-sm text-gray-600">
                {draft.subtitle.trim() ? draft.subtitle : "Short subtitle/description"}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {draft.priceType === "Free" ? "Free" : `NPR ${(draft.priceNpr ?? 0).toLocaleString()}`}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500">Language</p>
                  <p className="text-sm font-semibold text-gray-900">{draft.language}</p>
                </div>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Lessons: <span className="font-semibold text-gray-700">{draft.lessons.length}</span>
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <Link
                to="/courses"
                className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                View Courses
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
