// src/pages/admin/VerifyInstructorsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiEye, FiCheckCircle, FiXCircle } from "react-icons/fi";

import VerificationInstructorModal from "../../components/admin/VerificationInstructorModal";
import {
  type AdminVerificationItem,
  type VerificationStatus,
  listInstructorVerifications,
  approveInstructor,
  rejectInstructor,
} from "../../services/adminVerification";



const VerifyInstructorsPage = () => {
  const [items, setItems] = useState<AdminVerificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<VerificationStatus | "All">("All");

  const [openId, setOpenId] = useState<string | null>(null);
  const openItem = useMemo(() => items.find((x) => x.id === openId) ?? null, [items, openId]);

  const StatusBadge = ({
    value,
  }: {
    value: VerificationStatus;
  }) => {
    const cls =
      value === "Verified"
        ? "bg-green-50 text-green-700 ring-green-200"
        : value === "Rejected"
        ? "bg-red-50 text-red-700 ring-red-200"
        : "bg-yellow-50 text-yellow-700 ring-yellow-200";

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cls}`}>
        {value}
      </span>
    );
  };

  const load = async (params?: { q?: string; status?: "All" | VerificationStatus }) => {
    setLoading(true);
    setErr(null);

    try {
      const res = await listInstructorVerifications({
        q: params?.q ?? query,
        status: params?.status ?? status,
      });
      setItems(res.items || []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load verification requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = async () => {
    await load({ q: query, status });
  };

  const onChangeStatus = async (v: any) => {
    setStatus(v);
    // fetch immediately with new filter
    await load({ q: query, status: v });
  };

  const onApprove = async (id: string) => {
    setLoading(true);
    setErr(null);
    try {
      await approveInstructor(id);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Approve failed");
    } finally {
      setLoading(false);
    }
  };

  const onReject = async (id: string, reason: string) => {
    setLoading(true);
    setErr(null);
    try {
      await rejectInstructor(id, reason);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Reject failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Verify Instructors</h1>

        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <label className="text-xs font-semibold text-gray-700">Search</label>
            <div className="mt-2 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FiSearch className="h-4 w-4" />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSearch();
                }}
                placeholder="Search by name, email, expertise..."
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="button"
              onClick={onSearch}
              disabled={loading}
              className="mt-3 inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
            >
              Search
            </button>
          </div>

          <div className="lg:col-span-4">
            <label className="text-xs font-semibold text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => onChangeStatus(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              disabled={loading}
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{items.length}</span> request(s)
        </p>

        {err ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        ) : null}
      </section>

      {/* Table */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-600">Loading...</div>
        ) : (
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
                {items.map((x) => (
                  <tr key={x.id} className="align-top">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-gray-900">{x.fullName}</p>
                      <p className="mt-1 text-xs text-gray-500">{x.email}</p>
                      {x.institute ? (
                        <p className="mt-1 text-xs text-gray-600">{x.institute}</p>
                      ) : null}
                    </td>

                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        {(x.expertise || []).slice(0, 4).map((e) => (
                          <span
                            key={e}
                            className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200"
                          >
                            {e}
                          </span>
                        ))}
                        {x.expertise?.length > 4 ? (
                          <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                            +{x.expertise.length - 4}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="py-4 pr-4 text-gray-700">
                      {new Date(x.submittedAt).toLocaleDateString()}
                    </td>

                    <td className="py-4 pr-4">
                      <div className="flex flex-col gap-1 text-xs text-gray-700">
                        <span>{x.docs.idCard ? "✅" : "❌"} ID Card</span>
                        <span>{x.docs.certificate ? "✅" : "❌"} Certificate</span>
                        <span>{x.docs.experienceLetter ? "✅" : "❌"} Experience</span>
                      </div>
                    </td>

                    <td className="py-4 pr-4">
                      <StatusBadge value={x.status} />
                    </td>

                    <td className="py-4 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                          onClick={() => setOpenId(x.id)}
                        >
                          <FiEye className="h-4 w-4" />
                          View
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}

                {!items.length ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-gray-600">
                      No verification requests found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal */}
      {openItem ? (
        <VerificationInstructorModal
          item={openItem}
          busy={loading}
          onClose={() => setOpenId(null)}
          onApprove={async () => {
            await onApprove(openItem.id);
            setOpenId(null);
          }}
          onReject={async (reason) => {
            await onReject(openItem.id, reason);
            setOpenId(null);
          }}
        />
      ) : null}
    </div>
  );
};

export default VerifyInstructorsPage;