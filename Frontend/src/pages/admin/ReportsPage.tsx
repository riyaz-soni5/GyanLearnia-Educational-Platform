// src/pages/admin/ReportsPage.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type ReportTarget = "Question" | "Answer" | "User";
type ReportStatus = "Open" | "In Review" | "Resolved" | "Dismissed";
type Severity = "Low" | "Medium" | "High";

type ReportItem = {
  id: string;
  targetType: ReportTarget;
  targetId: string; // questionId / answerId / userId
  targetTitle: string; // question title or "Answer #123"
  reportedBy: string;
  reason: string;
  severity: Severity;
  status: ReportStatus;
  createdAt: string;

  accusedName?: string; // if User or author of Q/A
  accusedUsername?: string;

  preview: string; // short snippet to show in UI
  notes?: string;
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
  Flag: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 3v18" className="stroke-current" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M6 4h12l-2 4 2 4H6"
        className="stroke-current"
        strokeWidth="1.7"
        strokeLinejoin="round"
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
  Msg: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4z"
        className="stroke-current"
        strokeWidth="1.7"
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
  tone: "gray" | "green" | "yellow" | "red" | "indigo";
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

const severityTone = (s: Severity) => (s === "High" ? "red" : s === "Medium" ? "yellow" : "gray");
const statusTone = (s: ReportStatus) =>
  s === "Resolved" ? "green" : s === "Dismissed" ? "gray" : s === "In Review" ? "indigo" : "yellow";

const ReportsPage = () => {
  const [items, setItems] = useState<ReportItem[]>([
    {
      id: "r1",
      targetType: "Answer",
      targetId: "a_104",
      targetTitle: "Answer #104",
      reportedBy: "Student A",
      reason: "Spam link / promotion",
      severity: "High",
      status: "Open",
      createdAt: "2 hours ago",
      accusedName: "User X",
      accusedUsername: "user_x",
      preview: "This answer contains a suspicious link that redirects to an unknown website...",
    },
    {
      id: "r2",
      targetType: "Question",
      targetId: "q2",
      targetTitle: "Explain Kirchhoff’s Laws with a numerical example",
      reportedBy: "Tutor D",
      reason: "Off-topic / not academic",
      severity: "Medium",
      status: "In Review",
      createdAt: "1 day ago",
      accusedName: "Learner B",
      accusedUsername: "learner_b",
      preview: "The question includes unrelated content and does not match the subject guidelines...",
    },
    {
      id: "r3",
      targetType: "User",
      targetId: "u9",
      targetTitle: "User profile report",
      reportedBy: "Student C",
      reason: "Harassment / abusive language",
      severity: "High",
      status: "Open",
      createdAt: "3 days ago",
      accusedName: "User Z",
      accusedUsername: "user_z",
      preview: "User sent repeated rude messages in comments and threatened other students...",
    },
    {
      id: "r4",
      targetType: "Answer",
      targetId: "a_210",
      targetTitle: "Answer #210",
      reportedBy: "Student D",
      reason: "Incorrect solution / misleading",
      severity: "Low",
      status: "Resolved",
      createdAt: "6 days ago",
      accusedName: "Tutor K",
      accusedUsername: "tutor_k",
      preview: "The solution steps seem wrong in the final calculation. It may confuse SEE students...",
      notes: "Resolved: marked as 'Needs Review' and asked tutor to correct.",
    },
  ]);

  const [query, setQuery] = useState("");
  const [type, setType] = useState<ReportTarget | "All">("All");
  const [status, setStatus] = useState<ReportStatus | "All">("All");
  const [severity, setSeverity] = useState<Severity | "All">("All");

  const [openId, setOpenId] = useState<string | null>(null);
  const openItem = useMemo(() => items.find((x) => x.id === openId) ?? null, [items, openId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      const matchQuery =
        !q ||
        r.targetTitle.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.reportedBy.toLowerCase().includes(q) ||
        (r.accusedName ?? "").toLowerCase().includes(q) ||
        (r.accusedUsername ?? "").toLowerCase().includes(q);

      const matchType = type === "All" || r.targetType === type;
      const matchStatus = status === "All" || r.status === status;
      const matchSeverity = severity === "All" || r.severity === severity;

      return matchQuery && matchType && matchStatus && matchSeverity;
    });
  }, [items, query, type, status, severity]);

  const setStatusById = (id: string, next: ReportStatus, note?: string) => {
    setItems((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: next,
              notes: note ? note : r.notes,
            }
          : r
      )
    );
  };

  const onOpen = (id: string) => {
    setOpenId(id);
    // auto mark as "In Review" when opening (optional)
    setItems((prev) => prev.map((r) => (r.id === id && r.status === "Open" ? { ...r, status: "In Review" } : r)));
  };

  const takeActionRemoveContent = (id: string) => {
    const note = prompt("Action note (demo):", "Removed content / hidden from public") || "Removed content (demo)";
    setStatusById(id, "Resolved", note);
    alert("Static UI: Content removed (demo). Later call backend moderation endpoint.");
  };

  const takeActionWarnUser = (id: string) => {
    const note = prompt("Warning note (demo):", "Warned user for policy violation") || "Warned user (demo)";
    setStatusById(id, "Resolved", note);
    alert("Static UI: User warned (demo). Later call backend notifications.");
  };

  const dismiss = (id: string) => {
    const note = prompt("Dismiss reason (demo):", "Not a valid report") || "Dismissed (demo)";
    setStatusById(id, "Dismissed", note);
  };

  const resolve = (id: string) => {
    const note = prompt("Resolution note (demo):", "Resolved by admin") || "Resolved (demo)";
    setStatusById(id, "Resolved", note);
  };

  const linkForTarget = (r: ReportItem) => {
    if (r.targetType === "Question") return `/questions/${r.targetId}`;
    // For answers/users you may not have routes yet — keep as placeholder
    if (r.targetType === "Answer") return `/admin/reports`; // later: /questions/:qid#answer-xxx
    return `/admin/users`; // later: /admin/users/:id
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Reports</h1>
            <p className="mt-2 text-sm text-gray-600">
              Moderate reported questions/answers/users (static demo).
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white">
            <Icon.Flag className="h-4 w-4" />
            Open: {items.filter((x) => x.status === "Open").length}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <label className="text-xs font-semibold text-gray-700">Search</label>
            <div className="mt-2 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon.Search className="h-4 w-4" />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search report reason, accused, reporter..."
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <label className="text-xs font-semibold text-gray-700">Target</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="All">All</option>
              <option value="Question">Question</option>
              <option value="Answer">Answer</option>
              <option value="User">User</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="All">All</option>
              <option value="Open">Open</option>
              <option value="In Review">In Review</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-gray-700">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="All">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filtered.length}</span> report(s)
        </p>
      </section>

      {/* List */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge text={r.targetType} tone="gray" />
                    <Badge text={`Severity: ${r.severity}`} tone={severityTone(r.severity) as any} />
                    <Badge text={r.status} tone={statusTone(r.status) as any} />
                    <span className="text-xs text-gray-500">• {r.createdAt}</span>
                  </div>

                  <p className="mt-2 truncate text-sm font-semibold text-gray-900">{r.targetTitle}</p>
                  <p className="mt-1 text-xs text-gray-600">
                    Reported by <span className="font-semibold">{r.reportedBy}</span> • Reason:{" "}
                    <span className="font-semibold">{r.reason}</span>
                  </p>

                  {r.accusedUsername ? (
                    <p className="mt-1 text-xs text-gray-600">
                      Accused:{" "}
                      <span className="font-semibold text-gray-900">
                        {r.accusedName} @{r.accusedUsername}
                      </span>
                    </p>
                  ) : null}

                  <p className="mt-2 line-clamp-2 text-sm text-gray-700">{r.preview}</p>
                </div>

                <div className="inline-flex flex-wrap gap-2 sm:justify-end">
                  <Link
                    to={linkForTarget(r)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-white"
                    title="Open content (where possible)"
                  >
                    <Icon.Eye className="h-4 w-4" />
                    Open
                  </Link>

                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    onClick={() => onOpen(r.id)}
                  >
                    <Icon.Msg className="h-4 w-4" />
                    Review
                  </button>

                  {r.status !== "Resolved" && r.status !== "Dismissed" ? (
                    <>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                        onClick={() => dismiss(r.id)}
                      >
                        <Icon.X className="h-4 w-4" />
                        Dismiss
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                        onClick={() => resolve(r.id)}
                      >
                        <Icon.Check className="h-4 w-4" />
                        Resolve
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">No actions</span>
                  )}
                </div>
              </div>

              {r.notes ? (
                <div className="mt-3 rounded-xl bg-white px-4 py-3 ring-1 ring-gray-200">
                  <p className="text-xs font-semibold text-gray-700">Admin Notes</p>
                  <p className="mt-1 text-sm text-gray-700">{r.notes}</p>
                </div>
              ) : null}
            </div>
          ))}

          {!filtered.length ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
              No reports found.
            </div>
          ) : null}
        </div>

        <div className="mt-6 rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
          <p className="text-xs font-semibold text-gray-700">Backend later</p>
          <p className="mt-1 text-xs text-gray-600">
            Future endpoints idea:{" "}
            <span className="font-semibold">GET /admin/reports</span>,{" "}
            <span className="font-semibold">PATCH /admin/reports/:id</span>,{" "}
            <span className="font-semibold">POST /admin/moderation/actions</span>.
          </p>
        </div>
      </section>

      {/* Review Modal */}
      {openItem ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">Report Review</p>
                <h3 className="mt-1 truncate text-xl font-bold text-gray-900">{openItem.targetTitle}</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {openItem.targetType} • Reported {openItem.createdAt} • Reason:{" "}
                  <span className="font-semibold">{openItem.reason}</span>
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge text={openItem.targetType} tone="gray" />
                  <Badge text={`Severity: ${openItem.severity}`} tone={severityTone(openItem.severity) as any} />
                  <Badge text={openItem.status} tone={statusTone(openItem.status) as any} />
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
                <p className="text-sm font-bold text-gray-900">Preview</p>
                <p className="mt-2 text-sm text-gray-700">{openItem.preview}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-600">
                    Reported by <span className="font-semibold text-gray-900">{openItem.reportedBy}</span>
                  </span>
                  {openItem.accusedUsername ? (
                    <span className="text-xs text-gray-600">
                      • Accused{" "}
                      <span className="font-semibold text-gray-900">
                        {openItem.accusedName} @{openItem.accusedUsername}
                      </span>
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Actions (demo) */}
              <div>
                <p className="text-sm font-bold text-gray-900">Moderation Actions (demo)</p>
                <p className="mt-1 text-sm text-gray-600">
                  Choose an action. Later connect to backend moderation API.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                    onClick={() => takeActionRemoveContent(openItem.id)}
                  >
                    Remove Content
                  </button>

                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                    onClick={() => takeActionWarnUser(openItem.id)}
                  >
                    Warn User
                  </button>

                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                    onClick={() => dismiss(openItem.id)}
                  >
                    Dismiss Report
                  </button>

                  <button
                    type="button"
                    className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                    onClick={() => resolve(openItem.id)}
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>

              {openItem.notes ? (
                <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-200">
                  <p className="text-xs font-semibold text-gray-700">Current Notes</p>
                  <p className="mt-1 text-sm text-gray-700">{openItem.notes}</p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 p-6">
              <button
                type="button"
                className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                onClick={() => setOpenId(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReportsPage;
