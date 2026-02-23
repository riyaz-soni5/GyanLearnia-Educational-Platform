// src/layouts/AdminLayout.tsx
import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdVerifiedUser,
  MdMenuBook,
  MdPeople,
  MdAssessment,
  MdSettings,
  MdLogout,
  MdMenu,
  MdClose,
} from "react-icons/md";

const Icon = {
  Dashboard: (p: React.ComponentProps<"svg">) => <MdDashboard {...p} />,
  Verify: (p: React.ComponentProps<"svg">) => <MdVerifiedUser {...p} />,
  Courses: (p: React.ComponentProps<"svg">) => <MdMenuBook {...p} />,
  Users: (p: React.ComponentProps<"svg">) => <MdPeople {...p} />,
  Reports: (p: React.ComponentProps<"svg">) => <MdAssessment {...p} />,
  Settings: (p: React.ComponentProps<"svg">) => <MdSettings {...p} />,
  Logout: (p: React.ComponentProps<"svg">) => <MdLogout {...p} />,
  Menu: (p: React.ComponentProps<"svg">) => <MdMenu {...p} />,
  Close: (p: React.ComponentProps<"svg">) => <MdClose {...p} />,
};

const navItems = [
  { to: "/admin", label: "Dashboard", icon: Icon.Dashboard, end: true },
  { to: "/admin/verify-instructors", label: "Verify Instructors", icon: Icon.Verify },
  { to: "/admin/course-approvals", label: "Course Approvals", icon: Icon.Courses },
  { to: "/admin/users", label: "Users", icon: Icon.Users },
  { to: "/admin/reports", label: "Reports", icon: Icon.Reports },
  { to: "/admin/settings", label: "Settings", icon: Icon.Settings },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="space-y-1">
        {navItems.map((it) => {
          const Ico = it.icon;
          return (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end as any}
              onClick={onNavigate}
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
    </nav>
  );
}

const AdminLayout = () => {
  const adminName = "Admin";

  const onLogout = () => {
    localStorage.removeItem("gyanlearnia_session");
    window.location.href = "/login";
  };

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();

  // Close drawer on route change (mobile)
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close on Esc
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Prevent body scroll when drawer open
  React.useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex lg:hidden items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
              aria-label="Open sidebar"
            >
              <Icon.Menu className="h-5 w-5" />
            </button>

            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gray-900 text-white">
              <span className="text-sm font-bold">GL</span>
            </div>

            <div className="leading-tight">
              <p className="text-sm font-semibold text-gray-900">Admin Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-900">{adminName}</p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              title="Logout"
            >
              Logout
              <Icon.Logout className="h-4 w-4" color="red" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={[
          "fixed inset-0 z-40 lg:hidden",
          sidebarOpen ? "" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!sidebarOpen}
      >
        {/* overlay */}
        <div
          onClick={() => setSidebarOpen(false)}
          className={[
            "absolute inset-0 bg-black/30 transition-opacity",
            sidebarOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />

        {/* panel */}
        <div
          className={[
            "absolute left-0 top-0 h-full w-[85%] max-w-sm bg-gray-50 border-r border-gray-200 p-4 transition-transform",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
          role="dialog"
          aria-modal="true"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gray-900 text-white">
                <span className="text-sm font-bold">GL</span>
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-gray-900">Menu</p>
                <p className="text-xs text-gray-500">Admin navigation</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
              aria-label="Close sidebar"
            >
              <Icon.Close className="h-5 w-5" />
            </button>
          </div>

          <SidebarNav onNavigate={() => setSidebarOpen(false)} />
        </div>
      </div>

      <div className="flex-1">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="lg:sticky lg:top-20">
              <SidebarNav />
            </div>
          </aside>

          <main className="lg:col-span-9 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;