// src/pages/admin/ManageUsersPage.tsx
import { useMemo, useState } from "react";

type UserRole = "student" | "instructor" | "admin";
type UserStatus = "Active" | "Suspended";

type AdminUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  verifiedInstructor?: boolean; // only for instructors
  rank?: number; // for students/mentors idea
  joinedAt: string;
  lastActive: string;
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
  User: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5z"
        className="stroke-current"
        strokeWidth="1.7"
      />
      <path
        d="M3 22a9 9 0 0 1 18 0"
        className="stroke-current"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  Shield: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z"
        className="stroke-current"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-5"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Pause: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M8 6v12M16 6v12"
        className="stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Play: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M9 6l10 6-10 6V6z"
        className="stroke-current"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Trash: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
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
        d="M6 7l1 14h10l1-14"
        className="stroke-current"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 7V4h6v3"
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
  tone: "gray" | "indigo" | "green" | "yellow" | "red";
}) => {
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
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${cls}`}>
      {text}
    </span>
  );
};

const roleTone = (r: UserRole) => (r === "admin" ? "indigo" : r === "instructor" ? "green" : "gray");
const statusTone = (s: UserStatus) => (s === "Active" ? "green" : "red");

const ManageUsersPage = () => {
  // ✅ static demo users
  const [users, setUsers] = useState<AdminUser[]>([
    {
      id: "u1",
      name: "Salomi Kumari",
      username: "salomi_k",
      email: "salomi@email.com",
      role: "student",
      status: "Active",
      rank: 142,
      joinedAt: "2025-09-12",
      lastActive: "2 hours ago",
    },
    {
      id: "u2",
      name: "Astha Sharma",
      username: "astha_sharma",
      email: "astha@example.com",
      role: "instructor",
      status: "Active",
      verifiedInstructor: true,
      joinedAt: "2025-08-03",
      lastActive: "1 day ago",
    },
    {
      id: "u3",
      name: "Srawan Shrestha",
      username: "srawan_s",
      email: "srawan@example.com",
      role: "instructor",
      status: "Suspended",
      verifiedInstructor: false,
      joinedAt: "2025-10-01",
      lastActive: "2 weeks ago",
    },
    {
      id: "u4",
      name: "Admin",
      username: "admin",
      email: "admin@gyanlearnia.com",
      role: "admin",
      status: "Active",
      joinedAt: "2025-01-10",
      lastActive: "Online",
    },
  ]);

  const [query, setQuery] = useState("");
  const [role, setRole] = useState<UserRole | "All">("All");
  const [status, setStatus] = useState<UserStatus | "All">("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);

      const matchRole = role === "All" || u.role === role;
      const matchStatus = status === "All" || u.status === status;

      return matchQuery && matchRole && matchStatus;
    });
  }, [users, query, role, status]);

  const toggleSuspend = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "Active" ? "Suspended" : "Active" }
          : u
      )
    );
  };

  const deleteUser = (id: string) => {
    const ok = confirm("Delete user? (demo)");
    if (!ok) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Manage Users</h1>
        <p className="mt-2 text-sm text-gray-600">
          Search, filter, suspend/activate users (static demo).
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          {/* Search */}
          <div className="lg:col-span-6">
            <label className="text-xs font-semibold text-gray-700">Search</label>
            <div className="mt-2 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon.Search className="h-4 w-4" />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, username, email..."
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Role */}
          <div className="lg:col-span-3">
            <label className="text-xs font-semibold text-gray-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="All">All</option>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Status */}
          <div className="lg:col-span-3">
            <label className="text-xs font-semibold text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filtered.length}</span> user(s)
        </p>
      </section>

      {/* Table */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs font-semibold text-gray-500">
              <tr className="border-b border-gray-200">
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Joined</th>
                <th className="py-3 pr-4">Last Active</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr key={u.id} className="align-top">
                  <td className="py-4 pr-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gray-900 text-white">
                        <Icon.User className="h-5 w-5" />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{u.name}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          @{u.username} • {u.email}
                        </p>

                        {/* extra meta */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {u.role === "instructor" ? (
                            u.verifiedInstructor ? (
                              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                                <Icon.Shield className="h-4 w-4" />
                                Verified Instructor
                              </span>
                            ) : (
                              <Badge text="Instructor (Not verified)" tone="gray" />
                            )
                          ) : null}

                          {u.role === "student" && typeof u.rank === "number" ? (
                            <Badge text={`Rank #${u.rank}`} tone="gray" />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 pr-4">
                    <Badge text={u.role.toUpperCase()} tone={roleTone(u.role) as any} />
                  </td>

                  <td className="py-4 pr-4">
                    <Badge text={u.status} tone={statusTone(u.status) as any} />
                  </td>

                  <td className="py-4 pr-4 text-gray-700">{u.joinedAt}</td>

                  <td className="py-4 pr-4 text-gray-700">{u.lastActive}</td>

                  <td className="py-4 text-right">
                    <div className="inline-flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        className={[
                          "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold",
                          u.status === "Active"
                            ? "border border-gray-300 text-gray-800 hover:bg-gray-50"
                            : "bg-green-600 text-white hover:bg-green-700",
                        ].join(" ")}
                        onClick={() => toggleSuspend(u.id)}
                        title="Static demo"
                      >
                        {u.status === "Active" ? (
                          <>
                            <Icon.Pause className="h-4 w-4" />
                            Suspend
                          </>
                        ) : (
                          <>
                            <Icon.Play className="h-4 w-4" />
                            Activate
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                        onClick={() => deleteUser(u.id)}
                        title="Static demo"
                        disabled={u.role === "admin"} // prevent deleting admin in demo
                      >
                        <Icon.Trash className="h-4 w-4" />
                        Delete
                      </button>
                    </div>

                    {u.role === "admin" ? (
                      <p className="mt-2 text-xs text-gray-500">Admin protected</p>
                    ) : null}
                  </td>
                </tr>
              ))}

              {!filtered.length ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-gray-600">
                    No users found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Note */}
        <div className="mt-6 rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
          <p className="text-xs font-semibold text-gray-700">Backend later</p>
          <p className="mt-1 text-xs text-gray-600">
            Future endpoints idea: <span className="font-semibold">GET /admin/users</span>,{" "}
            <span className="font-semibold">PATCH /admin/users/:id/status</span>,{" "}
            <span className="font-semibold">DELETE /admin/users/:id</span>.
          </p>
        </div>
      </section>
    </div>
  );
};

export default ManageUsersPage;
