// src/pages/admin/VerifyInstructorsPage.tsx
import { useMemo, useState } from "react";

type VerificationStatus = "Pending" | "Verified" | "Rejected";

type InstructorVerification = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  expertise: string[];
  institute?: string;
  submittedAt: string;
  docs: {
    idCard: boolean;
    certificate: boolean;
    experienceLetter?: boolean;
  };
  status: VerificationStatus;
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
};

const Badge = ({ text, tone }: { text: string; tone: "yellow" | "green" | "red" | "gray" }) => {
  const cls =
    tone === "green"
      ? "bg-green-50 text-green-700 ring-green-200"
      : tone === "yellow"
      ? "bg-yellow-50 text-yellow-700 ring-yellow-200"
      : tone === "red"
      ? "bg-red-50 text-red-700 ring-red-200"
      : "bg-gray-50 text-gray-700 ring-gray-200";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cls}`}>
      {text}
    </span>
  );
};

const toneForStatus = (s: VerificationStatus) =>
  s === "Verified" ? "green" : s === "Rejected" ? "red" : s === "Pending" ? "yellow" : "gray";

const VerifyInstructorsPage = () => {
  // ✅ Static demo data (replace with API later)
  const [items, setItems] = useState<InstructorVerification[]>([
    {
      id: "v1",
      fullName: "Astha Sharma",
      username: "astha_sharma",
      email: "astha@example.com",
      expertise: ["Physics", "+2", "SEE"],
      institute: "Kathmandu Model College",
      submittedAt: "2 hours ago",
      docs: { idCard: true, certificate: true, experienceLetter: true },
      status: "Pending",
    },
    {
      id: "v2",
      fullName: "Srawan Shrestha",
      username: "srawan_s",
      email: "srawan@example.com",
      expertise: ["Computer Science", "MERN", "Skill"],
      institute: "Private Tutor",
      submittedAt: "1 day ago",
      docs: { idCard: true, certificate: true, experienceLetter: false },
      status: "Pending",
    },
    {
      id: "v3",
      fullName: "Verified Teacher",
      username: "verified_teacher",
      email: "teacher@example.com",
      expertise: ["Mathematics", "Class 10 (SEE)"],
      institute: "School Teacher",
      submittedAt: "5 days ago",
      docs: { idCard: true, certificate: true, experienceLetter: true },
      status: "Verified",
      notes: "Approved in demo",
    },
  ]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<VerificationStatus | "All">("All");

  // modal state
  const [openId, setOpenId] = useState<string | null>(null);
  const openItem = useMemo(() => items.find((x) => x.id === openId) ?? null, [items, openId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((x) => {
      const matchQuery =
        !q ||
        x.fullName.toLowerCase().includes(q) ||
        x.username.toLowerCase().includes(q) ||
        x.email.toLowerCase().includes(q) ||
        x.expertise.join(" ").toLowerCase().includes(q);

      const matchStatus = status === "All" || x.status === status;
      return matchQuery && matchStatus;
    });
  }, [items, query, status]);

  const approve = (id: string) => {
    setItems((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, status: "Verified", notes: "Approved by admin (static)" } : x
      )
    );
  };

  const reject = (id: string) => {
    const reason = prompt("Reject reason (demo):") || "Rejected by admin (static)";
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: "Rejected", notes: reason } : x))
    );
  };

  const DocItem = ({ label, ok }: { label: string; ok: boolean }) => (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-gray-200">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <Badge text={ok ? "Uploaded" : "Missing"} tone={ok ? "green" : "red"} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Verify Instructors</h1>
        <p className="mt-2 text-sm text-gray-600">
          Approve or reject instructor verification requests (static demo).
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <label className="text-xs font-semibold text-gray-700">Search</label>
            <div className="mt-2 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon.Search className="h-4 w-4" />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, username, email, expertise..."
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="lg:col-span-4">
            <label className="text-xs font-semibold text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filtered.length}</span> request(s)
        </p>
      </section>

      {/* Table */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs font-semibold text-gray-500">
              <tr className="border-b border-gray-200">
                <th className="py-3 pr-4">Instructor</th>
                <th className="py-3 pr-4">Expertise</th>
                <th className="py-3 pr-4">Submitted</th>
                <th className="py-3 pr-4">Docs</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filtered.map((x) => (
                <tr key={x.id} className="align-top">
                  <td className="py-4 pr-4">
                    <p className="font-semibold text-gray-900">{x.fullName}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      @{x.username} • {x.email}
                    </p>
                    {x.institute ? <p className="mt-1 text-xs text-gray-600">{x.institute}</p> : null}
                  </td>

                  <td className="py-4 pr-4">
                    <div className="flex flex-wrap gap-2">
                      {x.expertise.slice(0, 4).map((e) => (
                        <span
                          key={e}
                          className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200"
                        >
                          {e}
                        </span>
                      ))}
                      {x.expertise.length > 4 ? (
                        <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                          +{x.expertise.length - 4}
                        </span>
                      ) : null}
                    </div>
                  </td>

                  <td className="py-4 pr-4 text-gray-700">{x.submittedAt}</td>

                  <td className="py-4 pr-4">
                    <div className="flex flex-col gap-1 text-xs text-gray-700">
                      <span>{x.docs.idCard ? "✅" : "❌"} ID Card</span>
                      <span>{x.docs.certificate ? "✅" : "❌"} Certificate</span>
                      <span>{x.docs.experienceLetter ? "✅" : "❌"} Experience</span>
                    </div>
                  </td>

                  <td className="py-4 pr-4">
                    <Badge text={x.status} tone={toneForStatus(x.status) as any} />
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
                  <td colSpan={6} className="py-10 text-center text-sm text-gray-600">
                    No verification requests found.
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
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6">
              <div>
                <p className="text-xs font-semibold text-gray-500">Verification Detail</p>
                <h3 className="mt-1 text-xl font-bold text-gray-900">{openItem.fullName}</h3>
                <p className="mt-1 text-sm text-gray-600">
                  @{openItem.username} • {openItem.email}
                </p>
              </div>

              <button
                type="button"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                onClick={() => setOpenId(null)}
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge text={openItem.status} tone={toneForStatus(openItem.status) as any} />
                {openItem.institute ? (
                  <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                    {openItem.institute}
                  </span>
                ) : null}
                <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                  Submitted: {openItem.submittedAt}
                </span>
              </div>

              <div>
                <p className="text-sm font-bold text-gray-900">Expertise</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {openItem.expertise.map((e) => (
                    <span
                      key={e}
                      className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-gray-900">Documents</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <DocItem label="ID Card" ok={openItem.docs.idCard} />
                  <DocItem label="Certificate" ok={openItem.docs.certificate} />
                  <DocItem label="Experience Letter" ok={!!openItem.docs.experienceLetter} />
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  Demo: These are booleans. Later you can display actual document links/previews.
                </p>
              </div>

              {openItem.notes ? (
                <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
                  <p className="text-xs font-semibold text-gray-700">Admin Notes</p>
                  <p className="mt-1 text-sm text-gray-700">{openItem.notes}</p>
                </div>
              ) : null}
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

export default VerifyInstructorsPage;
