// src/pages/admin/ManageUsersPage.tsx
import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiUser, FiTrash2, FiRefreshCcw } from "react-icons/fi";

import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/toast";
import {
  type AdminUser,
  type AdminRoleFilter,
  type AdminRoleKey,
  deleteUserById,
  fetchAdminUsers,
  updateUserRoleById,
} from "@/services/adminUsers";

type Tone = "gray" | "indigo" | "green" | "yellow" | "red";

function Badge({ text, tone }: { text: string; tone: Tone }) {
  const cls =
    tone === "indigo"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
      : tone === "green"
      ? "bg-green-50 text-green-700 ring-green-200"
      : tone === "yellow"
      ? "bg-yellow-50 text-yellow-700 ring-yellow-200"
      : tone === "red"
      ? "bg-red-50 text-red-700 ring-red-200"
      : "bg-gray-50 text-gray-700 ring-gray-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cls}`}
    >
      {text}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

/** ✅ UI role label (Verified/Unverified Instructor) */
function getRoleKey(u: AdminUser): AdminRoleKey {
  if (u.role === "admin") return "admin";
  if (u.role === "student") return "student";
  const verified = u.isVerified || u.verificationStatus === "Verified";
  return verified ? "verified_instructor" : "unverified_instructor";
}

function roleLabel(key: AdminRoleKey) {
  if (key === "student") return "STUDENT";
  if (key === "admin") return "ADMIN";
  if (key === "verified_instructor") return "VERIFIED INSTRUCTOR";
  return "UNVERIFIED INSTRUCTOR";
}

function roleToneByKey(key: AdminRoleKey): Tone {
  if (key === "admin") return "indigo";
  if (key === "verified_instructor") return "green";
  if (key === "unverified_instructor") return "yellow";
  return "gray";
}

export default function ManageUsersPage() {
  const { showToast } = useToast();

  const [query, setQuery] = useState("");
  const [role, setRole] = useState<AdminRoleFilter>("All");

  const [page, setPage] = useState(1);
  const limit = 10;

  const [rows, setRows] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // per-row role selection
  const [rolePick, setRolePick] = useState<Record<string, AdminRoleKey>>({});
  const [roleSaving, setRoleSaving] = useState<Record<string, boolean>>({});

  // confirm dialog state (delete only)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);
  const [confirmTitle, setConfirmTitle] = useState("Confirm");
  const [confirmDesc, setConfirmDesc] = useState<string | undefined>(undefined);
  const [confirmLoading, setConfirmLoading] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchAdminUsers({ q: query, role, page, limit });
      setRows(data.items);
      setTotal(data.total);

      // init rolePick for visible rows (sync from backend)
      setRolePick((prev) => {
        const next = { ...prev };
        for (const u of data.items) {
          next[u.id] = getRoleKey(u);
        }
        return next;
      });
    } catch (e: any) {
      setErr(e?.message || "Failed to load users");
      showToast(e?.message || "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, role]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, query, role]);

  const showingFrom = useMemo(
    () => (total === 0 ? 0 : (page - 1) * limit + 1),
    [page, limit, total]
  );
  const showingTo = useMemo(
    () => Math.min(page * limit, total),
    [page, limit, total]
  );

  function openDeleteConfirm(u: AdminUser) {
    setConfirmTitle("Delete user?");
    setConfirmDesc("This action cannot be undone.");
    setConfirmAction(() => async () => {
      const prev = rows;
      setRows((p) => p.filter((x) => x.id !== u.id)); // optimistic
      try {
        await deleteUserById(u.id);
        showToast("User deleted", "success");
        await load();
      } catch (e: any) {
        setRows(prev);
        const msg = e?.message || "Delete failed";
        setErr(msg);
        showToast(msg, "error");
        throw e;
      }
    });
    setConfirmOpen(true);
  }

  async function handleRoleChange(u: AdminUser, nextRoleKey: AdminRoleKey) {
    const current = getRoleKey(u);
    if (nextRoleKey === current) return;

    // optimistic dropdown update (already changed in UI)
    setRoleSaving((p) => ({ ...p, [u.id]: true }));
    const prevRows = rows;
    const prevPick = rolePick[u.id] ?? current;

    // optimistic row update (so Role badge changes immediately)
    setRows((p) =>
      p.map((x) => {
        if (x.id !== u.id) return x;

        if (nextRoleKey === "student") {
          return { ...x, role: "student" as const };
        }
        if (nextRoleKey === "admin") {
          return { ...x, role: "admin" as const };
        }
        if (nextRoleKey === "verified_instructor") {
          return {
            ...x,
            role: "instructor" as const,
            isVerified: true,
            verificationStatus: "Verified" as const,
          };
        }
        // unverified instructor
        return {
          ...x,
          role: "instructor" as const,
          isVerified: false,
          verificationStatus:
            x.verificationStatus === "Verified"
              ? ("Pending" as const)
              : x.verificationStatus,
        };
      })
    );

    try {
      const out = await updateUserRoleById(u.id, nextRoleKey);

      // apply server truth
      setRows((p) =>
        p.map((x) =>
          x.id === out.id
            ? {
                ...x,
                role: out.role,
                isVerified: out.isVerified,
                verificationStatus: out.verificationStatus,
              }
            : x
        )
      );

      showToast(`Role updated to ${roleLabel(nextRoleKey)}`, "success");
    } catch (e: any) {
      // revert both row and dropdown
      setRows(prevRows);
      setRolePick((p) => ({ ...p, [u.id]: prevPick }));
      const msg = e?.message || "Failed to update role";
      setErr(msg);
      showToast(msg, "error");
    } finally {
      setRoleSaving((p) => ({ ...p, [u.id]: false }));
    }
  }

  const displayRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((u) => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      return fullName.includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [rows, query]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Manage Users
            </h1>
          </div>
        </div>

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
                placeholder="Search name or email..."
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="lg:col-span-4">
            <label className="text-xs font-semibold text-gray-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRoleFilter)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="All">All</option>
              <option value="student">Student</option>
              <option value="verified_instructor">Verified Instructor</option>
              <option value="unverified_instructor">Unverified Instructor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-600">
            {loading ? (
              "Loading..."
            ) : (
              <>
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {showingFrom}-{showingTo}
                </span>{" "}
                of <span className="font-semibold text-gray-900">{total}</span>
              </>
            )}
          </p>

          {err ? <p className="text-sm font-semibold text-red-700">{err}</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs font-semibold text-gray-500">
              <tr className="border-b border-gray-200">
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Joined</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {!loading && displayRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-gray-600">
                    No users found.
                  </td>
                </tr>
              ) : null}

              {displayRows.map((u) => {
                const fullName = `${u.firstName} ${u.lastName}`.trim();
                const currentKey = getRoleKey(u);
                const pickedKey = rolePick[u.id] ?? currentKey;
                const isAdmin = currentKey === "admin";
                const saving = Boolean(roleSaving[u.id]);

                return (
                  <tr key={u.id} className="align-top">
                    <td className="py-4 pr-4">
                      <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gray-900 text-white">
                          <FiUser className="h-5 w-5" />
                        </span>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">
                            {fullName || "(No name)"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">{u.email}</p>

                        </div>
                      </div>
                    </td>

                    <td className="py-4 pr-4">
                      <Badge text={roleLabel(currentKey)} tone={roleToneByKey(currentKey)} />
                    </td>

                    <td className="py-4 pr-4 text-gray-700">{formatDate(u.joinedAt)}</td>

                    <td className="py-4 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        {/* ✅ dropdown in Action column */}
                        <select
                          value={pickedKey}
                          onChange={(e) => {
                            const next = e.target.value as AdminRoleKey;
                            setRolePick((p) => ({ ...p, [u.id]: next }));
                            void handleRoleChange(u, next);
                          }}
                          disabled={isAdmin || saving}
                          className="h-10 rounded-lg border border-gray-300 bg-white px-2 text-sm disabled:opacity-60"
                          title={isAdmin ? "Admin protected" : saving ? "Updating..." : "Change role"}
                        >
                          <option value="student">Student</option>
                          <option value="verified_instructor">Verified Instructor</option>
                          <option value="unverified_instructor">Unverified Instructor</option>
                          <option value="admin">Admin</option>
                        </select>

                        <button
                          type="button"
                          className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                          onClick={() => openDeleteConfirm(u)}
                          disabled={isAdmin || confirmLoading}
                          title={isAdmin ? "Admin protected" : "Delete user"}
                        >
                          <FiTrash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>

                      {isAdmin ? <p className="mt-2 text-xs text-gray-500">Admin protected</p> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
            <span className="font-semibold text-gray-900">{totalPages}</span>
          </p>

          <div className="inline-flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            >
              Prev
            </button>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* ✅ ConfirmDialog only for delete */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDesc}
        tone="danger"
        confirmText="Delete"
        loading={confirmLoading}
        onClose={() => {
          if (confirmLoading) return;
          setConfirmOpen(false);
        }}
        onConfirm={() => {
          if (!confirmAction) return;

          setConfirmLoading(true);
          Promise.resolve()
            .then(confirmAction)
            .then(() => setConfirmOpen(false))
            .catch((e: any) => {
              const msg = e?.message || "Delete failed";
              setErr(msg);
              showToast(msg, "error");
            })
            .finally(() => setConfirmLoading(false));
        }}
      />
    </div>
  );
}