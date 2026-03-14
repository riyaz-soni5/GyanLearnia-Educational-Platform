
import React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FiMoon, FiSun } from "react-icons/fi";
import {
  MdDashboard,
  MdVerifiedUser,
  MdMenuBook,
  MdPeople,
  MdAssessment,
  MdLogout,
  MdMenu,
  MdClose,
} from "react-icons/md";
import LogoIcon from "@/assets/icon.svg";
import { logout } from "@/services/session";

const Icon = {
  Dashboard: (p: React.ComponentProps<"svg">) => <MdDashboard {...p} />,
  Verify: (p: React.ComponentProps<"svg">) => <MdVerifiedUser {...p} />,
  Courses: (p: React.ComponentProps<"svg">) => <MdMenuBook {...p} />,
  Users: (p: React.ComponentProps<"svg">) => <MdPeople {...p} />,
  Reports: (p: React.ComponentProps<"svg">) => <MdAssessment {...p} />,
  Logout: (p: React.ComponentProps<"svg">) => <MdLogout {...p} />,
  Menu: (p: React.ComponentProps<"svg">) => <MdMenu {...p} />,
  Close: (p: React.ComponentProps<"svg">) => <MdClose {...p} />,
};

const navItems = [
  { to: "/admin", label: "Dashboard", icon: Icon.Dashboard, end: true },
  { to: "/admin/verify-instructors", label: "Manage Instructor", icon: Icon.Verify },
  { to: "/admin/course-approvals", label: "Manage Course", icon: Icon.Courses },
  { to: "/admin/users", label: "Manage Users", icon: Icon.Users },
  { to: "/admin/reports", label: "Reports", icon: Icon.Reports },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-gray-900 dark:shadow-none">
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
                    ? "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5",
                ].join(" ")
              }
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-gray-200 text-gray-800 dark:bg-gray-950 dark:ring-white/10 dark:text-gray-200">
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
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      localStorage.removeItem("gyanlearnia_session");
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();
  const pageTitle = React.useMemo(() => {
    const current = navItems.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
    );
    return current?.label || "Admin";
  }, [location.pathname]);


  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);


  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);


  React.useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  React.useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col dark:bg-black">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-gray-950/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex lg:hidden items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
              aria-label="Open sidebar"
            >
              <Icon.Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center justify-center rounded-lg bg-white p-1 shadow-sm">
              <img src={LogoIcon} alt="GyanLearnia Logo" className="h-8 w-auto" />
            </div>

            <div className="leading-tight">
              <p className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white sm:text-xl">{pageTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{adminName}</p>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {theme === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
              title="Logout"
            >
              {loggingOut ? "Logging out..." : "Logout"}
              <Icon.Logout className="h-4 w-4" color="red" />
            </button>
          </div>
        </div>
      </header>


      <div
        className={[
          "fixed inset-0 z-40 lg:hidden",
          sidebarOpen ? "" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!sidebarOpen}
      >

        <div
          onClick={() => setSidebarOpen(false)}
          className={[
            "absolute inset-0 bg-black/30 transition-opacity",
            sidebarOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />


        <div
          className={[
            "absolute left-0 top-0 h-full w-[85%] max-w-sm bg-gray-50 border-r border-gray-200 p-4 transition-transform dark:border-white/10 dark:bg-black",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
          role="dialog"
          aria-modal="true"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg bg-white p-1 shadow-sm">
                <img src={LogoIcon} alt="GyanLearnia Logo" className="h-8 w-auto" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Menu</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admin navigation</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
              aria-label="Close sidebar"
            >
              <Icon.Close className="h-5 w-5" />
            </button>
          </div>

          <SidebarNav onNavigate={() => setSidebarOpen(false)} />
        </div>
      </div>

      <div className="flex-1 pt-[73px]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:relative">
          <aside className="hidden lg:fixed lg:top-24 lg:block lg:w-72">
            <div className="max-h-[calc(100vh-7rem)] overflow-y-auto">
              <SidebarNav />
            </div>
          </aside>

          <main className="min-w-0 lg:ml-[19rem]">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
