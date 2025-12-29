// src/pages/admin/AdminDashboardPage.tsx
import { useMemo } from "react";
import { Link } from "react-router-dom";

const Icon = {
  Verify: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" className="stroke-current" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-5" className="stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Courses: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path d="M4 5h16v14H4V5z" className="stroke-current" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8 9h8M8 12h8M8 15h6" className="stroke-current" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Users: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path d="M16 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zM6 13a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" className="stroke-current" strokeWidth="1.7" />
      <path d="M2 22a6 6 0 0 1 12 0M12 22a6 6 0 0 1 10 0" className="stroke-current" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Flag: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path d="M6 3v18" className="stroke-current" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6 4h12l-2 4 2 4H6" className="stroke-current" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  ),
};

const StatCard = ({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  hint?: string;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
      </div>
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
        {icon}
      </div>
    </div>
  </div>
);

const AdminDashboardPage = () => {
  // ✅ Static demo numbers (replace with API later)
  const stats = useMemo(
    () => ({
      pendingInstructorVerifications: 7,
      pendingCourseApprovals: 12,
      reportedQuestions: 4,
      totalUsers: 15420,
    }),
    []
  );

  const recent = [
    { id: "a1", title: "Instructor request: Astha Sharma", meta: "Documents submitted", time: "2 hours ago" },
    { id: "a2", title: "Course approval: Physics (+2) — Mechanics", meta: "Pending review", time: "1 day ago" },
    { id: "a3", title: "Reported Q&A: “Spam link in answer”", meta: "Needs moderation", time: "2 days ago" },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Quick overview of approvals, verification, reports, and platform health (static UI).
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Instructor Verifications"
          value={`${stats.pendingInstructorVerifications}`}
          hint="Pending"
          icon={<Icon.Verify className="h-5 w-5" />}
        />
        <StatCard
          label="Course Approvals"
          value={`${stats.pendingCourseApprovals}`}
          hint="Pending"
          icon={<Icon.Courses className="h-5 w-5" />}
        />
        <StatCard
          label="Reported Q&A"
          value={`${stats.reportedQuestions}`}
          hint="Needs action"
          icon={<Icon.Flag className="h-5 w-5" />}
        />
        <StatCard
          label="Total Users"
          value={stats.totalUsers.toLocaleString()}
          hint="Students + instructors"
          icon={<Icon.Users className="h-5 w-5" />}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: quick actions */}
        <section className="lg:col-span-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          <p className="mt-2 text-sm text-gray-600">Common admin tasks for demo.</p>

          <div className="mt-5 space-y-3">
            <Link
              to="/admin/verify-instructors"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Icon.Verify className="h-4 w-4" />
              Verify Instructors
            </Link>

            <Link
              to="/admin/course-approvals"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              <Icon.Courses className="h-4 w-4" />
              Approve Courses
            </Link>

            <Link
              to="/admin/reports"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              <Icon.Flag className="h-4 w-4" />
              Review Reports
            </Link>

            <Link
              to="/admin/users"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              <Icon.Users className="h-4 w-4" />
              Manage Users
            </Link>
          </div>

          <div className="mt-6 rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
            <p className="text-xs font-semibold text-gray-700">Demo note</p>
            <p className="mt-1 text-xs text-gray-600">
              Keep approval lists static for now. Later connect to backend endpoints:
              <span className="font-semibold"> /admin/verifications</span>, <span className="font-semibold">/admin/courses</span>.
            </p>
          </div>
        </section>

        {/* Right: recent queue */}
        <section className="lg:col-span-7 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Recent Queue</h2>
          <p className="mt-2 text-sm text-gray-600">Latest items waiting for admin action.</p>

          <div className="mt-5 space-y-3">
            {recent.map((r) => (
              <div key={r.id} className="rounded-2xl bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{r.title}</p>
                    <p className="mt-1 text-xs text-gray-600">{r.meta}</p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-500">{r.time}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    onClick={() => alert("Static UI: open details later")}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                    onClick={() => alert("Static UI: approve action later")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                    onClick={() => alert("Static UI: reject action later")}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
