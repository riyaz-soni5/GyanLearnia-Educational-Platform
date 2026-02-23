// src/pages/admin/CourseApprovalsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import RejectReasonDialog from "../../components/admin/RejectReasonDialog";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useToast } from "../../components/toast";
import { FiSearch, FiEye, FiCheck, FiX, FiAward, FiBookOpen } from "react-icons/fi";

// ✅ Make sure you have these service functions (file example: src/services/adminCourses.ts)
// - listPendingCourses(): Promise<{ items: CourseApproval[] }>
// - approveCourse(id: string): Promise<any>
// - rejectCourse(id: string, reason: string): Promise<any>
import { listPendingCourses, approveCourse, rejectCourse } from "../../services/adminCourse";

type ApprovalStatus = "Pending" | "Approved" | "Rejected";

type CourseApproval = {
  id: string;
  title: string;
  subtitle: string;
  type: "Academic" | "Technical" | "Vocational" | "Skill";
  level: string;
  priceType: "Free" | "Paid";
  priceNpr?: number;

  instructorName: string;
  instructorEmail: string;
  instructorVerified: boolean;

  submittedAt: string;
  status: ApprovalStatus;
  notes?: string;

  checklist: {
    hasThumbnail: boolean;
    hasOutline: boolean;
    hasAtLeast3Lessons: boolean;
    hasDescription: boolean;
    hasPricingIfPaid: boolean;
  };

  lessonsCount: number;
  hours: number;
  totalVideoSec: number;

  description?: string;
  thumbnailUrl?: string;
  outcomes: string[];
  requirements: string[];
  sections: Array<{
    id: string;
    title: string;
    lectures: Array<{
      id: string;
      title: string;
      type: string;
      durationSec: number;
      isFreePreview: boolean;
    }>;
  }>;
};

type RawPendingLecture = {
  _id?: unknown;
  id?: unknown;
  title?: unknown;
  type?: unknown;
  durationSec?: unknown;
  isFreePreview?: unknown;
};

type RawPendingSection = {
  _id?: unknown;
  id?: unknown;
  title?: unknown;
  lectures?: unknown;
};

type RawPendingCourse = {
  id?: unknown;
  title?: unknown;
  subtitle?: unknown;
  category?: unknown;
  level?: unknown;
  price?: unknown;
  instructor?: {
    name?: unknown;
    email?: unknown;
    isVerified?: unknown;
  } | null;
  createdAt?: unknown;
  status?: unknown;
  rejectionReason?: unknown;
  description?: unknown;
  thumbnailUrl?: unknown;
  outcomes?: unknown;
  requirements?: unknown;
  totalLectures?: unknown;
  totalVideoSec?: unknown;
  sections?: unknown;
};

const toErrorMessage = (e: unknown, fallback: string) =>
  e instanceof Error ? e.message : fallback;

const Icon = {
  Search: FiSearch,
  Eye: FiEye,
  Check: FiCheck,
  X: FiX,
  Badge: FiAward,
  Book: FiBookOpen,
};

const Badge = ({
  text,
  tone,
}: {
  text: string;
  tone: "yellow" | "green" | "red" | "gray" | "indigo";
}) => {
  const cls =
    tone === "green"
      ? "bg-green-50 text-green-700 ring-green-200"
      : tone === "yellow"
      ? "bg-yellow-50 text-yellow-700 ring-yellow-200"
      : tone === "red"
      ? "bg-red-50 text-red-700 ring-red-200"
      : tone === "indigo"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
      : "bg-gray-50 text-gray-700 ring-gray-200";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cls}`}>
      {text}
    </span>
  );
};

const toneForStatus = (s: ApprovalStatus) =>
  s === "Approved" ? "green" : s === "Rejected" ? "red" : "yellow";

const CheckRow = ({ label, ok }: { label: string; ok: boolean }) => (
  <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-gray-200">
    <p className="text-sm font-semibold text-gray-900">{label}</p>
    <Badge text={ok ? "OK" : "Missing"} tone={ok ? "green" : "red"} />
  </div>
);

const actionBtnClass =
  "inline-flex w-24 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold";

const CourseApprovalsPage = () => {
  const { showToast } = useToast();

  // ✅ REAL DATA (no static demo list)
  const [items, setItems] = useState<CourseApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ApprovalStatus | "All">("All");
  const [type, setType] = useState<CourseApproval["type"] | "All">("All");

  const [openId, setOpenId] = useState<string | null>(null);
  const openItem = useMemo(() => items.find((x) => x.id === openId) ?? null, [items, openId]);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);

  // ✅ Reject dialog state
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  // ✅ Load pending courses
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await listPendingCourses();
        if (!alive) return;
        setItems(
        res.items.map((c: RawPendingCourse) => {
          const sections = Array.isArray(c.sections)
            ? (c.sections as RawPendingSection[]).map((s, idx: number) => ({
                id: String(s._id ?? s.id ?? idx + 1),
                title: String(s.title ?? `Section ${idx + 1}`),
                lectures: Array.isArray(s.lectures)
                  ? (s.lectures as RawPendingLecture[]).map((l, lectureIdx: number) => ({
                      id: String(l._id ?? l.id ?? `${idx + 1}-${lectureIdx + 1}`),
                      title: String(l.title ?? "Untitled lecture"),
                      type: String(l.type ?? "note"),
                      durationSec: Number(l.durationSec ?? 0),
                      isFreePreview: Boolean(l.isFreePreview),
                    }))
                  : [],
              }))
            : [];

          const lessonsCount =
            Number(c.totalLectures ?? 0) ||
            sections.reduce((acc: number, s) => acc + s.lectures.length, 0);

          const totalVideoSec =
            Number(c.totalVideoSec ?? 0) ||
            sections.reduce(
              (acc: number, s) =>
                acc +
                s.lectures.reduce((sum: number, l) => sum + Number(l.durationSec || 0), 0),
              0
            );

          return {
          id: String(c.id ?? ""),
          title: String(c.title ?? ""),
          subtitle: String(c.subtitle ?? ""),
          type: String(c.category ?? "Academic") as CourseApproval["type"], // backend -> category
          level: String(c.level ?? "Unknown"),

          priceType: Number(c.price ?? 0) > 0 ? "Paid" : "Free",
          priceNpr: Number(c.price ?? 0),

          instructorName: String(c.instructor?.name ?? "Instructor"),
          instructorEmail: String(c.instructor?.email ?? "no-email"),
          instructorVerified: Boolean(c.instructor?.isVerified),

          submittedAt: String(c.createdAt ?? new Date().toISOString()),
          status: String(c.status ?? "Pending") as ApprovalStatus,

          notes: c.rejectionReason ? String(c.rejectionReason) : undefined,

          lessonsCount,

          totalVideoSec,
          hours: Math.round((totalVideoSec / 3600) * 10) / 10,

          description: c.description ? String(c.description) : "",
          thumbnailUrl: c.thumbnailUrl ? String(c.thumbnailUrl) : undefined,
          outcomes: Array.isArray(c.outcomes) ? c.outcomes.map((x) => String(x)) : [],
          requirements: Array.isArray(c.requirements) ? c.requirements.map((x) => String(x)) : [],
          sections,

          checklist: {
            hasThumbnail: Boolean(c.thumbnailUrl),
            hasOutline: sections.length > 0 && sections.some((s) => s.lectures.length > 0),
            hasAtLeast3Lessons: lessonsCount >= 3,
            hasDescription: Boolean(c.description),
            hasPricingIfPaid: Number(c.price ?? 0) === 0 || Number(c.price ?? 0) >= 50,
          },
        };
      })
      );
      } catch (e: unknown) {
        if (!alive) return;
        setErr(toErrorMessage(e, "Failed to load course submissions"));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((x) => {
      const matchQuery =
        !q ||
        x.title.toLowerCase().includes(q) ||
        x.subtitle.toLowerCase().includes(q) ||
        x.instructorName.toLowerCase().includes(q) ||
        x.instructorEmail.toLowerCase().includes(q) ||
        x.level.toLowerCase().includes(q);

      const matchStatus = status === "All" || x.status === status;
      const matchType = type === "All" || x.type === type;

      return matchQuery && matchStatus && matchType;
    });
  }, [items, query, status, type]);

  const approve = async (id: string) => {
    setApproveLoading(true);
    try {
      await approveCourse(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      showToast("Course approved ✅", "success");
      if (openId === id) setOpenId(null);
    } catch (e: unknown) {
      showToast(toErrorMessage(e, "Approve failed"), "error");
    } finally {
      setApproveLoading(false);
      setApproveId(null);
    }
  };

  // open dialog
  const reject = (id: string) => setRejectId(id);

  const priceText = (x: CourseApproval) =>
    x.priceType === "Free" ? "Free" : `NPR ${x.priceNpr?.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Course Approvals</h1>
        <p className="mt-2 text-sm text-gray-600">Review course submissions and approve/reject them.</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <label className="text-xs font-semibold text-gray-700">Search</label>
            <div className="mt-2 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon.Search className="h-4 w-4" />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search course title, level, instructor..."
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <label className="text-xs font-semibold text-gray-700">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CourseApproval["type"] | "All")}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="All">All</option>
              <option value="Academic">Academic</option>
              <option value="Technical">Technical</option>
              <option value="Vocational">Vocational</option>
              <option value="Skill">Skill</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="text-xs font-semibold text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ApprovalStatus | "All")}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filtered.length}</span> course(s)
        </p>

        {loading ? <p className="mt-3 text-sm text-gray-500">Loading...</p> : null}
        {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
      </section>

      {/* Table */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs font-semibold text-gray-500">
              <tr className="border-b border-gray-200">
                <th className="py-3 pr-4">Course</th>
                <th className="py-3 pr-4">Instructor</th>
                <th className="py-3 pr-4">Type/Level</th>
                <th className="py-3 pr-4">Lessons</th>
                <th className="py-3 pr-4">Price</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filtered.map((x) => (
                <tr key={x.id} className="align-top">
                  <td className="py-4 pr-4">
                    <p className="font-semibold text-gray-900">{x.title}</p>
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">{x.subtitle}</p>
                    <p className="mt-2 text-xs text-gray-500">Submitted {new Date(x.submittedAt).toLocaleDateString()}</p>
                  </td>

                  <td className="py-4 pr-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">{x.instructorName}</p>
                      <p className="text-xs text-gray-500">{x.instructorEmail}</p>
                    </div>
                  </td>

                  <td className="py-4 pr-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                        {x.type}
                      </span>
                      <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                        {x.type === "Academic" ? x.level : "N/A"}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 pr-4 text-gray-700">
                    {x.lessonsCount} lessons
                    <p className="mt-1 text-xs text-gray-500">{x.hours} hrs</p>
                  </td>

                  <td className="py-4 pr-4 font-semibold text-gray-900">{priceText(x)}</td>

                  <td className="py-4 pr-4">
                    <Badge text={x.status} tone={toneForStatus(x.status)} />
                    {x.notes ? <p className="mt-2 text-xs text-gray-600">{x.notes}</p> : null}
                  </td>

                  <td className="py-4 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        className={`${actionBtnClass} border border-gray-300 text-gray-800 hover:bg-gray-50`}
                        onClick={() => setOpenId(x.id)}
                      >
                        <Icon.Eye className="h-4 w-4" />
                        View
                      </button>

                      {x.status === "Pending" ? (
                        <>
                          <button
                            type="button"
                            className={`${actionBtnClass} bg-indigo-600 text-white hover:bg-indigo-700`}
                            onClick={() => setApproveId(x.id)}
                          >
                            <Icon.Check className="h-4 w-4" />
                            Approve
                          </button>

                          <button
                            type="button"
                            className={`${actionBtnClass} border border-gray-300 text-red-700 hover:bg-red-50`}
                            onClick={() => reject(x.id)}
                          >
                            <Icon.X className="h-4 w-4" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">No actions</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!filtered.length ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-gray-600">
                    No course submissions found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal */}
      {openItem ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-4 sm:p-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">Course Review</p>
                <h3 className="mt-1 truncate text-xl font-bold text-gray-900">{openItem.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{openItem.subtitle}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge text={openItem.type} tone="gray" />
                  <Badge text={openItem.type === "Academic" ? openItem.level : "N/A"} tone="gray" />
                  <Badge text={openItem.status} tone={toneForStatus(openItem.status)} />
                  <Badge text={priceText(openItem)} tone="indigo" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                aria-label="Close modal"
                title="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-8">
                  {openItem.thumbnailUrl ? (
                    <div className="overflow-hidden rounded-2xl border border-gray-200">
                      <img src={openItem.thumbnailUrl} alt={openItem.title} className="h-56 w-full object-cover sm:h-72" />
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-bold text-gray-900">Description</p>
                    <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
                      {openItem.description?.trim() || "No description provided."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-bold text-gray-900">Curriculum</p>
                    {openItem.sections.length ? (
                      <div className="mt-3 space-y-3">
                        {openItem.sections.map((s, i) => (
                          <div key={s.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <p className="text-sm font-semibold text-gray-900">
                              Section {i + 1}: {s.title}
                            </p>
                            <p className="mt-1 text-xs text-gray-600">{s.lectures.length} lectures</p>
                            <div className="mt-2 space-y-2">
                              {s.lectures.map((l) => (
                                <div key={l.id} className="flex items-center justify-between gap-2 text-xs text-gray-700">
                                  <span className="truncate">
                                    {l.title} ({l.type})
                                    {l.isFreePreview ? " • Preview" : ""}
                                  </span>
                                  <span>{Math.max(0, Math.round(Number(l.durationSec || 0) / 60))} min</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-600">No curriculum found.</p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <p className="text-sm font-bold text-gray-900">Outcomes</p>
                      {openItem.outcomes.length ? (
                        <ul className="mt-2 space-y-1 text-sm text-gray-700">
                          {openItem.outcomes.map((o, idx) => (
                            <li key={`${o}-${idx}`}>• {o}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-gray-600">No outcomes listed.</p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <p className="text-sm font-bold text-gray-900">Requirements</p>
                      {openItem.requirements.length ? (
                        <ul className="mt-2 space-y-1 text-sm text-gray-700">
                          {openItem.requirements.map((r, idx) => (
                            <li key={`${r}-${idx}`}>• {r}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-gray-600">No requirements listed.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 lg:col-span-4">
                  <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
                    <p className="text-sm font-bold text-gray-900">Instructor</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{openItem.instructorName}</p>
                      <span className="text-sm text-gray-600">{openItem.instructorEmail}</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Submitted: {new Date(openItem.submittedAt).toLocaleDateString()}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <p className="text-xs font-semibold text-gray-500">Lessons</p>
                      <p className="mt-2 text-xl font-bold text-gray-900">{openItem.lessonsCount}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <p className="text-xs font-semibold text-gray-500">Hours</p>
                      <p className="mt-2 text-xl font-bold text-gray-900">{openItem.hours}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <p className="text-xs font-semibold text-gray-500">Price</p>
                      <p className="mt-2 text-xl font-bold text-gray-900">{priceText(openItem)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-gray-900">Checklist</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                      <CheckRow label="Thumbnail" ok={openItem.checklist.hasThumbnail} />
                      <CheckRow label="Course Outline" ok={openItem.checklist.hasOutline} />
                      <CheckRow label="At least 3 lessons" ok={openItem.checklist.hasAtLeast3Lessons} />
                      <CheckRow label="Description" ok={openItem.checklist.hasDescription} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 p-4 sm:p-6">
              {openItem.status === "Pending" ? (
                <>
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                    onClick={() => reject(openItem.id)}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                    onClick={() => setApproveId(openItem.id)}
                  >
                    Approve
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                  onClick={() => setOpenId(null)}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Reject Reason Dialog */}
      <RejectReasonDialog
        open={Boolean(rejectId)}
        title="Reject course?"
        description="Please provide a clear reason. The instructor will see this message."
        confirmText="Reject"
        cancelText="Cancel"
        minLength={4}
        loading={rejectLoading}
        onClose={() => {
          if (rejectLoading) return;
          setRejectId(null);
        }}
        onConfirm={async (reason: string) => {
          if (!rejectId) return;

          setRejectLoading(true);
          try {
            await rejectCourse(rejectId, reason);
            setItems((prev) => prev.filter((x) => x.id !== rejectId));
            showToast("Course rejected ✅", "success");
            if (openId === rejectId) setOpenId(null);
            setRejectId(null);
          } catch (e: unknown) {
            showToast(toErrorMessage(e, "Reject failed"), "error");
          } finally {
            setRejectLoading(false);
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(approveId)}
        title="Approve this course?"
        description="This will publish the course and make it visible to students."
        confirmText="Approve"
        cancelText="Cancel"
        tone="primary"
        loading={approveLoading}
        onClose={() => {
          if (approveLoading) return;
          setApproveId(null);
        }}
        onConfirm={() => {
          if (!approveId) return;
          void approve(approveId);
        }}
      />
    </div>
  );
};

export default CourseApprovalsPage;
