// src/components/Header.tsx
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sun, Moon, User, LogOut } from "lucide-react";
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
};

const Header = () => {
  const nav = useNavigate();
  const location = useLocation(); // ✅ add

  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [user, setUser] = useState<StoredUser | null>(null);

  // ✅ cookie auth => do NOT rely on token in localStorage
  const isLoggedIn = useMemo(() => !!user, [user]);

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  // ✅ re-load user whenever route changes (after login redirect)
  useEffect(() => {
    const raw =
    localStorage.getItem("gyanlearnia_user") ||
    sessionStorage.getItem("gyanlearnia_user");
    setUser(raw ? (JSON.parse(raw) as StoredUser) : null);
  }, [location.pathname]);

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

  const logout = () => {
    // ✅ if using cookies, also call backend logout route ideally
    localStorage.removeItem("gyanlearnia_user");
    sessionStorage.removeItem("gyanlearnia_user");
    setUser(null);
    setOpen(false);
    nav("/", { replace: true });
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
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
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
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  aria-label="Open profile menu"
                >
                  <User size={18} />
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-base bg-surface shadow-lg">
                    <div className="px-4 py-3">
                      <p className="text-sm font-semibold text-basec">{displayName}</p>
                      <p className="text-xs text-muted">{user?.email}</p>
                    </div>

                    <div className="h-px bg-base" />

                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-basec hover:bg-[rgb(var(--bg))]"
                    >
                      <LogOut size={16} />
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