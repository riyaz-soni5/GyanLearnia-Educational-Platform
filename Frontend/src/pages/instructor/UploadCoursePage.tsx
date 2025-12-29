// src/pages/instructor/UploadCoursePage.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type LessonType = "Video" | "Note" | "Quiz";

type LessonDraft = {
  id: string;
  title: string;
  type: LessonType;
  durationMin: number; // for notes you can keep 0 or estimate
  isPreview: boolean;
};

type CourseDraft = {
  title: string;
  subtitle: string;
  level: "Class 8" | "Class 9" | "Class 10 (SEE)" | "+2" | "Skill";
  category: "Academic" | "Technical" | "Vocational";
  subject:
    | "Mathematics"
    | "Science"
    | "Physics"
    | "Chemistry"
    | "Biology"
    | "English"
    | "Nepali"
    | "Accountancy"
    | "Economics"
    | "Computer Science"
    | "Business Studies"
    | "Other";
  priceType: "Free" | "Paid";
  priceNpr?: number;
  language: "English" | "Nepali";
  thumbnailUrl: string;
  description: string;
  outcomes: string[];
  requirements: string[];
  lessons: LessonDraft[];
};

const Icon = {
  Upload: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 16V4"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 9l5-5 5 5"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 20h16"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Plus: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 5v14M5 12h14"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Trash: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 7h16"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 11v7M14 11v7"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9 7l1-3h4l1 3"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M6 7l1 15h10l1-15"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Move: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2v20M2 12h20"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 2l-3 3M12 2l3 3M2 12l3-3M2 12l3 3M12 22l-3-3M12 22l3-3M22 12l-3-3M22 12l-3 3"
        className="stroke-current"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  ),
  Check: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20 6L9 17l-5-5"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const SectionTitle = ({
  title,
  desc,
}: {
  title: string;
  desc?: string;
}) => (
  <div className="flex items-end justify-between gap-4">
    <div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {desc ? <p className="mt-1 text-sm text-gray-600">{desc}</p> : null}
    </div>
  </div>
);

const Chip = ({ text }: { text: string }) => (
  <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
    {text}
  </span>
);

const UploadCoursePage = () => {
  const [draft, setDraft] = useState<CourseDraft>({
    title: "",
    subtitle: "",
    level: "Class 10 (SEE)",
    category: "Academic",
    subject: "Mathematics",
    priceType: "Free",
    priceNpr: 999,
    language: "English",
    thumbnailUrl: "",
    description: "",
    outcomes: ["", "", ""],
    requirements: ["", ""],
    lessons: [
      {
        id: "l1",
        title: "Introduction / Course Overview",
        type: "Video",
        durationMin: 10,
        isPreview: true,
      },
    ],
  });

  const [toast, setToast] = useState<string | null>(null);

  const isValid = useMemo(() => {
    const hasTitle = draft.title.trim().length >= 6;
    const hasSubtitle = draft.subtitle.trim().length >= 10;
    const hasDesc = draft.description.trim().length >= 30;
    const hasLessons = draft.lessons.length >= 1 && draft.lessons.every((l) => l.title.trim().length >= 4);
    const paidOk = draft.priceType === "Free" || (draft.priceNpr !== undefined && draft.priceNpr >= 50);
    return hasTitle && hasSubtitle && hasDesc && hasLessons && paidOk;
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

  const addLesson = () => {
    setDraft((p) => ({
      ...p,
      lessons: [
        ...p.lessons,
        {
          id: `l_${Date.now()}`,
          title: "",
          type: "Video",
          durationMin: 10,
          isPreview: false,
        },
      ],
    }));
  };

  const updateLesson = (id: string, patch: Partial<LessonDraft>) => {
    setDraft((p) => ({
      ...p,
      lessons: p.lessons.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  };

  const removeLesson = (id: string) => {
    setDraft((p) => ({ ...p, lessons: p.lessons.filter((l) => l.id !== id) }));
  };

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

  const onSaveDraft = () => {
    localStorage.setItem("gyanlearnia_course_draft", JSON.stringify(draft));
    setToast("Draft saved (localStorage).");
    setTimeout(() => setToast(null), 1600);
  };

  const onLoadDraft = () => {
    const raw = localStorage.getItem("gyanlearnia_course_draft");
    if (!raw) {
      setToast("No saved draft found.");
      setTimeout(() => setToast(null), 1600);
      return;
    }
    try {
      setDraft(JSON.parse(raw));
      setToast("Draft loaded.");
      setTimeout(() => setToast(null), 1600);
    } catch {
      setToast("Draft load failed.");
      setTimeout(() => setToast(null), 1600);
    }
  };

  const onPublish = () => {
    if (!isValid) {
      setToast("Please fill required fields before publishing.");
      setTimeout(() => setToast(null), 1800);
      return;
    }

    // ✅ Later: POST to backend /courses
    // await api.post("/courses", draft)

    setToast("Course published (static).");
    setTimeout(() => setToast(null), 1800);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">Instructor</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Upload Course
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Build a course with clean structure (title, outcomes, lessons). Keep it simple for FYP UI.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Chip text="Academic-friendly" />
              <Chip text="SEE / +2 / Skill" />
              <Chip text="Static for now" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onLoadDraft}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Load Draft
            </button>
            <button
              type="button"
              onClick={onSaveDraft}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={onPublish}
              className={[
                "rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition",
                isValid ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-400 cursor-not-allowed",
              ].join(" ")}
              disabled={!isValid}
            >
              Publish
            </button>
          </div>
        </div>

        {toast ? (
          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
            {toast}
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Basic info */}
          <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <SectionTitle
              title="Basic Information"
              desc="Write a clear title + short subtitle. Keep it exam-friendly."
            />

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
                <label className="text-xs font-medium text-gray-700">Subtitle / Short Description *</label>
                <input
                  value={draft.subtitle}
                  onChange={(e) => setDraft((p) => ({ ...p, subtitle: e.target.value }))}
                  placeholder="e.g., Algebra, Geometry, Trigonometry — exam-focused practice"
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
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
                    onChange={(e) => setDraft((p) => ({ ...p, priceType: e.target.value as CourseDraft["priceType"] }))}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option>Free</option>
                    <option>Paid</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">Price (NPR)</label>
                  <input
                    type="number"
                    value={draft.priceType === "Free" ? 0 : draft.priceNpr ?? 0}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        priceNpr: Number(e.target.value || 0),
                      }))
                    }
                    disabled={draft.priceType === "Free"}
                    className={[
                      "mt-2 w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2",
                      draft.priceType === "Free"
                        ? "border-gray-200 bg-gray-50 text-gray-400"
                        : "border-gray-300 focus:border-indigo-600 focus:ring-indigo-100",
                    ].join(" ")}
                    placeholder="e.g., 1499"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    If paid: keep NPR 50+ (static validation)
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Thumbnail URL (optional)</label>
                <input
                  value={draft.thumbnailUrl}
                  onChange={(e) => setDraft((p) => ({ ...p, thumbnailUrl: e.target.value }))}
                  placeholder="https://..."
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <SectionTitle
              title="Course Description"
              desc="Explain what this course covers and how it helps students."
            />

            <textarea
              value={draft.description}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              rows={6}
              placeholder="Write a detailed description (min 30 chars). Example: This course covers..."
              className="mt-6 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-6">
                <p className="text-sm font-semibold text-gray-900">Outcomes (What students will learn)</p>
                <div className="mt-4 space-y-3">
                  {draft.outcomes.map((v, i) => (
                    <input
                      key={i}
                      value={v}
                      onChange={(e) => updateOutcome(i, e.target.value)}
                      placeholder={`Outcome ${i + 1}`}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Lessons builder */}
          <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <SectionTitle
                title="Lessons Builder"
                desc="Add lessons in order. Mark 1–2 lessons as preview."
              />
              <button
                type="button"
                onClick={addLesson}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Icon.Plus className="h-4 w-4" />
                Add Lesson
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {draft.lessons.map((l, idx) => (
                <div key={l.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-500">Lesson {idx + 1}</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-12">
                        <div className="sm:col-span-6">
                          <label className="text-xs font-medium text-gray-700">Lesson Title *</label>
                          <input
                            value={l.title}
                            onChange={(e) => updateLesson(l.id, { title: e.target.value })}
                            placeholder="e.g., Quadratic Equations (SEE)"
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-xs font-medium text-gray-700">Type</label>
                          <select
                            value={l.type}
                            onChange={(e) => updateLesson(l.id, { type: e.target.value as LessonType })}
                            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          >
                            <option>Video</option>
                            <option>Note</option>
                            <option>Quiz</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-xs font-medium text-gray-700">Duration (min)</label>
                          <input
                            type="number"
                            value={l.durationMin}
                            onChange={(e) =>
                              updateLesson(l.id, { durationMin: Math.max(0, Number(e.target.value || 0)) })
                            }
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>
                      </div>

                      <label className="mt-4 inline-flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={l.isPreview}
                          onChange={(e) => updateLesson(l.id, { isPreview: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-200"
                        />
                        Mark as Preview (free access)
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title="Move up"
                        onClick={() => moveLesson(l.id, -1)}
                        className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50"
                      >
                        <Icon.Move className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        title="Delete"
                        onClick={() => removeLesson(l.id)}
                        className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50"
                      >
                        <Icon.Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {!draft.lessons.length ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
                  No lessons yet. Click <span className="font-semibold">Add Lesson</span>.
                </div>
              ) : null}
            </div>
          </section>
        </div>

        {/* Sidebar preview */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Preview</h3>
            <p className="mt-2 text-sm text-gray-600">
              This is how it may look in course listing (static).
            </p>

            <div className="mt-5 rounded-2xl bg-gray-50 p-5">
              <p className="text-xs font-semibold text-gray-500">
                {draft.category} • {draft.level} • {draft.subject}
              </p>
              <p className="mt-2 text-lg font-bold text-gray-900">
                {draft.title.trim() ? draft.title : "Course Title"}
              </p>
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
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4">
                <p className="text-xs font-semibold text-gray-700">Validation</p>
                <p className="mt-1 text-xs text-gray-600">
                  {isValid ? (
                    <span className="inline-flex items-center gap-2 text-green-700">
                      <Icon.Check className="h-4 w-4" /> Ready to publish
                    </span>
                  ) : (
                    "Fill required fields (title, subtitle, description, lessons)."
                  )}
                </p>
              </div>

              <Link
                to="/courses"
                className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                View Courses
              </Link>

              <button
                type="button"
                onClick={() => alert("Static UI: preview page later")}
                className="inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Preview Course Page
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-gray-900 p-6 text-white">
            <p className="text-lg font-bold">Instructor Tip</p>
            <p className="mt-2 text-sm text-gray-300">
              Keep lesson titles short and exam-focused. Add 1 preview lesson for trust.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default UploadCoursePage;
