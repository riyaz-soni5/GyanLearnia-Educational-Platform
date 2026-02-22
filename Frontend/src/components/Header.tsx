// src/components/Header.tsx
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiSun,
  FiMoon,
  FiUser,
  FiLogOut,
  FiChevronDown,
  FiShield,
  FiUploadCloud,
  FiSettings,
} from "react-icons/fi";
import Logo from "../assets/icon.svg";

type NavItem = { name: string; path: string };

const navItems: NavItem[] = [
  { name: "Courses", path: "/courses" },
  { name: "Questions", path: "/questions" },
  { name: "Mentors", path: "/mentors" },
  { name: "Pricings", path: "/pricing" },
  { name: "About", path: "/about" },
];

type StoredUser = {
  id: string;
  role: "student" | "instructor" | "admin";
  email: string;
  firstName?: string;
  lastName?: string;
  isVerified?: boolean;
  verificationStatus?: "NotSubmitted" | "Pending" | "Rejected" | "Verified";
};

function readStoredUser(): StoredUser | null {
  const raw =
    localStorage.getItem("gyanlearnia_user") ||
    sessionStorage.getItem("gyanlearnia_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

const Header = () => {
  const nav = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [user, setUser] = useState<StoredUser | null>(null);

  const isLoggedIn = useMemo(() => !!user?.id, [user]);

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // theme init
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  // reload user on route change (after login redirect)
  useEffect(() => {
    setUser(readStoredUser());
  }, [location.pathname]);

  // close menu on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return;
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  };

  const displayName =
    user?.firstName || user?.lastName
      ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
      : "Profile";

  const isInstructor = user?.role === "instructor";
  const isAdmin = user?.role === "admin";

  // ✅ instructor verification rule
  const instructorVerified =
    Boolean(user?.isVerified) || user?.verificationStatus === "Verified";

  const go = (path: string) => {
    setOpen(false);
    nav(path);
  };

  const logout = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("gyanlearnia_user");
      sessionStorage.removeItem("gyanlearnia_user");
      setUser(null);
      setOpen(false);
      nav("/", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-screen border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-white p-1 shadow-sm">
              <img src={Logo} alt="GyanLearnia Logo" className="h-8 w-auto" />
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive
                      ? "text-indigo-600"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {theme === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
            </button>

            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white sm:inline-flex"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setOpen((s) => !s)}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  aria-label="Open profile menu"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-gray-900 text-white">
                    <FiUser className="h-4 w-4" />
                  </span>
                  <span className="hidden text-sm font-semibold sm:inline-block">
                    {displayName}
                  </span>
                  <FiChevronDown className="h-4 w-4 opacity-70" />
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-base bg-surface shadow-lg">
                    <div className="px-4 py-3">
                      <p className="text-sm font-semibold text-basec">{displayName}</p>
                      <p className="text-xs text-muted">{user?.email}</p>

                      {/* optional: show role line */}
                      <p className="mt-1 text-xs text-muted">
                        {isAdmin
                          ? "Admin"
                          : isInstructor
                          ? instructorVerified
                            ? "Verified Instructor"
                            : "Instructor (Unverified)"
                          : "Student"}
                      </p>
                    </div>

                    <div className="h-px bg-base" />

                    {/* Profile - for all */}
                    <button
                      type="button"
                      onClick={() => go("/profile")}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-basec hover:bg-[rgb(var(--bg))]"
                    >
                      <FiSettings className="h-4 w-4" />
                      Profile
                    </button>

                    {/* Instructor options */}
                    {isInstructor ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            go(instructorVerified ? "/instructor/dashboard" : "/instructor/verify")
                          }
                          className="flex w-full items-center gap-2 px-4 py-3 text-sm text-basec hover:bg-[rgb(var(--bg))]"
                        >
                          <FiShield className="h-4 w-4" />
                          {instructorVerified ? "Instructor Dashboard" : "Verify Instructor"}
                        </button>

                        <button
                          type="button"
                          onClick={() => go("/instructor/upload-course")}
                          className="flex w-full items-center gap-2 px-4 py-3 text-sm text-basec hover:bg-[rgb(var(--bg))]"
                        >
                          <FiUploadCloud className="h-4 w-4" />
                          Upload Course
                        </button>
                      </>
                    ) : null}

                    {/* Admin options */}
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => go("/admin")}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-basec hover:bg-[rgb(var(--bg))]"
                      >
                        <FiShield className="h-4 w-4" />
                        Admin Dashboard
                      </button>
                    ) : null}

                    <div className="h-px bg-base" />

                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-basec hover:bg-[rgb(var(--bg))]"
                    >
                      <FiLogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;