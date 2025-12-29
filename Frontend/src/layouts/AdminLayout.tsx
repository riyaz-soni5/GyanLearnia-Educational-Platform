// src/layouts/AdminLayout.tsx
import { NavLink, Outlet } from "react-router-dom";

const Icon = {
  Dashboard: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path d="M4 4h8v8H4V4zM12 12h8v8h-8v-8zM12 4h8v6h-8V4zM4 14h8v6H4v-6z" className="stroke-current" strokeWidth="1.7" />
    </svg>
  ),
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
  Reports: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path d="M6 3h12v18H6V3z" className="stroke-current" strokeWidth="1.7" />
      <path d="M9 8h6M9 12h6M9 16h5" className="stroke-current" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Settings: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
        className="stroke-current"
        strokeWidth="1.7"
      />
      <path
        d="M19.4 15a8.5 8.5 0 0 0 .1-1 8.5 8.5 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8.7 8.7 0 0 0-1.7-1L15 2h-6l-.3 2.6a8.7 8.7 0 0 0-1.7 1l-2.4-1-2 3.4L4.6 13a8.5 8.5 0 0 0-.1 1 8.5 8.5 0 0 0 .1 1l-2 1.5 2 3.4 2.4-1a8.7 8.7 0 0 0 1.7 1L9 22h6l.3-2.6a8.7 8.7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5z"
        className="stroke-current"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Logout: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
      <path d="M10 7V5a2 2 0 0 1 2-2h8v18h-8a2 2 0 0 1-2-2v-2" className="stroke-current" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M3 12h10" className="stroke-current" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7 8l-4 4 4 4" className="stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const navItems = [
  { to: "/admin", label: "Dashboard", icon: Icon.Dashboard, end: true },
  { to: "/admin/verify-instructors", label: "Verify Instructors", icon: Icon.Verify },
  { to: "/admin/course-approvals", label: "Course Approvals", icon: Icon.Courses },
  { to: "/admin/users", label: "Users", icon: Icon.Users },
  { to: "/admin/reports", label: "Reports", icon: Icon.Reports },
  { to: "/admin/settings", label: "Settings", icon: Icon.Settings },
];

const AdminLayout = () => {
  const adminName = "Admin";
  const onLogout = () => {
    localStorage.removeItem("gyanlearnia_session");
    window.location.href = "/login";
  };

  return (
    <div className="w-screen bg-gray-50">
      {/* Admin topbar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gray-900 text-white">
              <span className="text-sm font-bold">GL</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-gray-900">GyanLearnia Admin</p>
              <p className="text-xs text-gray-500">Moderation & platform management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-900">{adminName}</p>
              <p className="text-xs text-gray-500">System Administrator</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              title="Logout (static)"
            >
              <Icon.Logout className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12">
        {/* Admin sidebar */}
        <aside className="lg:col-span-3">
          <nav className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            <p className="px-3 pb-2 text-xs font-semibold text-gray-500">Admin Menu</p>

            <div className="space-y-1">
              {navItems.map((it) => {
                const Ico = it.icon;
                return (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    end={it.end as any}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                        isActive
                          ? "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200"
                          : "text-gray-700 hover:bg-gray-50",
                      ].join(" ")
                    }
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-gray-200 text-gray-800">
                      <Ico className="h-5 w-5" />
                    </span>
                    <span className="truncate">{it.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl bg-gray-900 p-4 text-white">
              <p className="text-sm font-bold">Admin Tip</p>
              <p className="mt-1 text-xs text-gray-300">
                Keep approvals and verification simple for demo—use static lists now, API later.
              </p>
            </div>
          </nav>
        </aside>

        {/* Admin content */}
        <main className="lg:col-span-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
