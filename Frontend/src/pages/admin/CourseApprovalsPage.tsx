// src/pages/admin/CourseApprovalsPage.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type ApprovalStatus = "Pending" | "Approved" | "Rejected";

type CourseApproval = {
  id: string;
  title: string;
  subtitle: string;
  type: "Academic" | "Technical" | "Vocational";
  level: string;
  priceType: "Free" | "Paid";
  priceNpr?: number;

  instructorName: string;
  instructorUsername: string;
  instructorVerified: boolean;

  submittedAt: string;
  status: ApprovalStatus;
  notes?: string;

  // simple checklist for admin view
  checklist: {
    hasThumbnail: boolean;
    hasOutline: boolean;
    hasAtLeast3Lessons: boolean;
    hasDescription: boolean;
    hasPricingIfPaid: boolean;
  };

  lessonsCount: number;
  hours: number;
};

const Icon = {
  Search: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
        className="stroke-current"
        strokeWidth="1.8"
      />
      <path
        d="M21 21l-4.3-4.3"
        className="stroke-current"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  Eye: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        className="stroke-current"
        strokeWidth="1.8"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
        className="stroke-current"
        strokeWidth="1.8"
      />
    </svg>
  ),
  Check: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M20 6L9 17l-5-5"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  X: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M6 6l12 12M18 6L6 18"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Badge: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z"
        className="stroke-current"
        strokeWidth="1.6"
      />
      <path
        d="M9 12l2 2 4-5"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Book: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 0-2 2V4z"
        className="stroke-current"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M7 20V6a2 2 0 0 1 2-2h12"
        className="stroke-current"
        strokeWidth="1.6"
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

const CourseApprovalsPage = () => {
  const [items, setItems] = useState<CourseApproval[]>([
    {
      id: "cA1",
      title: "Physics (+2) — Mechanics",
      subtitle: "Concept + numericals with structured notes",
      type: "Academic",
      level: "+2",
      priceType: "Paid",
      priceNpr: 1499,
      instructorName: "Astha Sharma",
      instructorUsername: "astha_sharma",
      instructorVerified: true,
      submittedAt: "1 day ago",
      status: "Pending",
      lessonsCount: 30,
      hours: 22,
      checklist: {
        hasThumbnail: true,
        hasOutline: true,
        hasAtLeast3Lessons: true,
        hasDescription: true,
        hasPricingIfPaid: true,
      },
    },
    {
      id: "cA2",
      title: "Basic Graphic Design",
      subtitle: "Design principles + Canva workflow (beginner friendly)",
      type: "Vocational",
      level: "Skill",
      priceType: "Paid",
      priceNpr: 999,
      instructorName: "Verified Instructor",
      instructorUsername: "verified_instructor",
      instructorVerified: false,
      submittedAt: "2 days ago",
      status: "Pending",
      lessonsCount: 12,
      hours: 10,
      checklist: {
        hasThumbnail: false,
        hasOutline: true,
        hasAtLeast3Lessons: true,
        hasDescription: true,
        hasPricingIfPaid: true,
      },
    },
    {
      id: "cA3",
      title: "English (Class 9) — Writing Formats",
      subtitle: "Essay, letter, report writing — exam-ready structure",
      type: "Academic",
      level: "Class 9",
      priceType: "Free",
      instructorName: "Verified Teacher",
      instructorUsername: "verified_teacher",
      instructorVerified: true,
      submittedAt: "5 days ago",
      status: "Approved",
      notes: "Approved (demo).",
      lessonsCount: 14,
      hours: 9,
      checklist: {
        hasThumbnail: true,
        hasOutline: true,
        hasAtLeast3Lessons: true,
        hasDescription: true,
        hasPricingIfPaid: true,
      },
    },
  ]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ApprovalStatus | "All">("All");
  const [type, setType] = useState<CourseApproval["type"] | "All">("All");

  const [openId, setOpenId] = useState<string | null>(null);
  const openItem = useMemo(() => items.find((x) => x.id === openId) ?? null, [items, openId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((x) => {
      const matchQuery =
        !q ||
        x.title.toLowerCase().includes(q) ||
        x.subtitle.toLowerCase().includes(q) ||
        x.instructorName.toLowerCase().includes(q) ||
        x.instructorUsername.toLowerCase().includes(q) ||
        x.level.toLowerCase().includes(q);

      const matchStatus = status === "All" || x.status === status;
      const matchType = type === "All" || x.type === type;

      return matchQuery && matchStatus && matchType;
    });
  }, [items, query, status, type]);

  const approve = (id: string) => {
    setItems((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, status: "Approved", notes: "Approved by admin (static)" } : x
      )
    );
  };

  const reject = (id: string) => {
    const reason = prompt("Reject reason (demo):") || "Rejected by admin (static)";
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: "Rejected", notes: reason } : x)));
  };

  const priceText = (x: CourseApproval) =>
    x.priceType === "Free" ? "Free" : `NPR ${x.priceNpr?.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Course Approvals</h1>
        <p className="mt-2 text-sm text-gray-600">
          Review course submissions and approve/reject them (static demo).
        </p>

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
              onChange={(e) => setType(e.target.value as any)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="All">All</option>
              <option value="Academic">Academic</option>
              <option value="Technical">Technical</option>
              <option value="Vocational">Vocational</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="text-xs font-semibold text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
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
                    <p className="mt-2 text-xs text-gray-500">Submitted {x.submittedAt}</p>
                  </td>

                  <td className="py-4 pr-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">{x.instructorName}</p>
                      <p className="text-xs text-gray-500">@{x.instructorUsername}</p>
                      {x.instructorVerified ? (
                        <Badge text="Verified" tone="indigo" />
                      ) : (
                        <Badge text="Not verified" tone="gray" />
                      )}
                    </div>
                  </td>

                  <td className="py-4 pr-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                        {x.type}
                      </span>
                      <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                        {x.level}
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
                    <div className="inline-flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                        onClick={() => setOpenId(x.id)}
                      >
                        <Icon.Eye className="h-4 w-4" />
                        View
                      </button>

                      {x.status === "Pending" ? (
                        <>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            onClick={() => approve(x.id)}
                          >
                            <Icon.Check className="h-4 w-4" />
                            Approve
                          </button>

                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
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
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">Course Review</p>
                <h3 className="mt-1 truncate text-xl font-bold text-gray-900">{openItem.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{openItem.subtitle}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge text={openItem.type} tone="gray" />
                  <Badge text={openItem.level} tone="gray" />
                  <Badge text={openItem.status} tone={toneForStatus(openItem.status)} />
                  <Badge text={priceText(openItem)} tone="indigo" />
                </div>
              </div>

              <button
                type="button"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                onClick={() => setOpenId(null)}
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
                <p className="text-sm font-bold text-gray-900">Instructor</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{openItem.instructorName}</p>
                  <span className="text-sm text-gray-600">@{openItem.instructorUsername}</span>
                  {openItem.instructorVerified ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                      <Icon.Badge className="h-4 w-4" />
                      Verified
                    </span>
                  ) : (
                    <Badge text="Not verified" tone="gray" />
                  )}
                </div>

                <p className="mt-2 text-xs text-gray-500">Submitted: {openItem.submittedAt}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
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
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <CheckRow label="Thumbnail" ok={openItem.checklist.hasThumbnail} />
                  <CheckRow label="Course Outline" ok={openItem.checklist.hasOutline} />
                  <CheckRow label="At least 3 lessons" ok={openItem.checklist.hasAtLeast3Lessons} />
                  <CheckRow label="Description" ok={openItem.checklist.hasDescription} />
                  <CheckRow label="Pricing (if paid)" ok={openItem.checklist.hasPricingIfPaid} />
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Demo: later you can validate these from backend or from uploaded content.
                </p>
              </div>

              <div className="rounded-2xl bg-indigo-50 p-4 ring-1 ring-indigo-200">
                <p className="text-sm font-bold text-indigo-900">Quick Preview</p>
                <p className="mt-1 text-sm text-indigo-800">
                  In future, link this to the course details page to preview as admin.
                </p>

                <Link
                  to={`/courses/${openItem.id}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <Icon.Book className="h-4 w-4" />
                  Open Public Course Page
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 p-6">
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
                    onClick={() => approve(openItem.id)}
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
    </div>
  );
};

export default CourseApprovalsPage;
