// src/components/Header.tsx
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiSun,
  FiMoon,
  FiUser,
  FiLogOut,
  FiChevronDown,
  FiShield,
  FiGrid,
  FiMenu,
  FiX,
  FiBell,
  FiCreditCard,
} from "react-icons/fi";
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from "@/services/notifications";
import Logo from "@/assets/icon.svg";
import { applyTheme, getPreferredTheme, type AppTheme } from "@/lib/theme";

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
  avatarUrl?: string | null;
  isVerified?: boolean;
  verificationStatus?: "NotSubmitted" | "Pending" | "Rejected" | "Verified";
  currentPlan?: "Free" | "Pro";
  planStatus?: "Active" | "Expired";
  planActivatedAt?: string | null;
  planExpiresAt?: string | null;
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

function formatNotificationTime(dateLike: string) {
  const createdAt = new Date(dateLike);
  if (Number.isNaN(createdAt.getTime())) return "";

  const diffMs = Date.now() - createdAt.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return createdAt.toLocaleDateString();
}

const Header = () => {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const nav = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState<AppTheme>(() => getPreferredTheme());
  const [user, setUser] = useState<StoredUser | null>(null);

  const isLoggedIn = useMemo(() => !!user?.id, [user]);

  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // reload user on route change (after login redirect)
  useEffect(() => {
    setUser(readStoredUser());
    setMobileOpen(false);
    setOpen(false);
    setNotificationOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const syncUser = () => setUser(readStoredUser());
    window.addEventListener("gyanlearnia_user_updated", syncUser);
    return () => window.removeEventListener("gyanlearnia_user_updated", syncUser);
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!isLoggedIn) return;
    setNotificationLoading(true);
    try {
      const data = await fetchNotifications(20);
      setNotifications(data.items || []);
      setUnreadCount(Number(data.unreadCount || 0));
    } catch {
      // ignore fetch errors for header polling
    } finally {
      setNotificationLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]);
      setUnreadCount(0);
      setNotificationOpen(false);
      return;
    }

    void loadNotifications();
    const timer = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => window.clearInterval(timer);
  }, [isLoggedIn, loadNotifications]);

  // close menu on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open && !notificationOpen) return;
      const target = e.target as Node;
      if (open && menuRef.current && !menuRef.current.contains(target)) setOpen(false);
      if (
        notificationOpen &&
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, notificationOpen]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("theme", next);
  };

  const displayName =
    user?.firstName || user?.lastName
      ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
      : "Profile";
  const initials = (
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}` ||
    user?.email?.[0] ||
    "U"
  ).toUpperCase();
  const avatarUrl = user?.avatarUrl
    ? user.avatarUrl.startsWith("http")
      ? user.avatarUrl
      : `${API_BASE}${user.avatarUrl.startsWith("/") ? user.avatarUrl : `/${user.avatarUrl}`}`
    : null;

  const isInstructor = user?.role === "instructor";
  const isAdmin = user?.role === "admin";

  // ✅ instructor verification rule
  const instructorVerified =
    Boolean(user?.isVerified) || user?.verificationStatus === "Verified";

  const go = (path: string) => {
    setOpen(false);
    setNotificationOpen(false);
    nav(path);
  };

  const toggleNotificationPanel = () => {
    setOpen(false);
    setNotificationOpen((prev) => !prev);
    void loadNotifications();
  };

  const openNotification = async (item: AppNotification) => {
    if (!item.isRead) {
      try {
        const result = await markNotificationAsRead(item.id);
        setUnreadCount(Number(result.unreadCount || 0));
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === item.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        );
      } catch {
        // ignore mark-read failure and continue navigation
      }
    }

    setNotificationOpen(false);
    if (item.link) nav(item.link);
  };

  const markAllAsRead = async () => {
    try {
      const result = await markAllNotificationsAsRead();
      setUnreadCount(Number(result.unreadCount || 0));
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }))
      );
    } catch {
      // ignore failures
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("gyanlearnia_user");
      sessionStorage.removeItem("gyanlearnia_user");
      setUser(null);
      setOpen(false);
      setNotificationOpen(false);
      setNotifications([]);
      setUnreadCount(0);
      nav("/", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {theme === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((s) => !s)}
              aria-label="Toggle mobile menu"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800 md:hidden"
            >
              {mobileOpen ? <FiX className="h-4 w-4" /> : <FiMenu className="h-4 w-4" />}
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
              <div className="hidden items-center gap-2 md:flex">
                <div className="relative" ref={notificationRef}>
                  <button
                    type="button"
                    onClick={toggleNotificationPanel}
                    className="relative inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                    aria-label="Open notifications"
                  >
                    <FiBell className="h-5 w-5" />
                    {unreadCount > 0 ? (
                      <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : null}
                  </button>

                  {notificationOpen && (
                    <div className="absolute right-0 mt-2 w-[22rem] overflow-hidden rounded-xl border border-base bg-surface shadow-lg">
                      <div className="flex items-center justify-between px-4 py-3">
                        <p className="text-sm font-semibold text-basec">Notifications</p>
                        {unreadCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => void markAllAsRead()}
                            className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-700"
                          >
                            Mark all as read
                          </button>
                        ) : null}
                      </div>

                      <div className="max-h-96 overflow-y-auto border-t border-base">
                        {notificationLoading ? (
                          <p className="px-4 py-6 text-center text-sm text-muted">Loading...</p>
                        ) : notifications.length ? (
                          notifications.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => void openNotification(item)}
                              className={`w-full cursor-pointer border-b border-base px-4 py-3 text-left last:border-b-0 hover:bg-[rgb(var(--bg))]
                                ${item.isRead ? "" : "bg-indigo-50/70 dark:bg-indigo-950/20"}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-basec">{item.title}</p>
                                  <p className="mt-1 line-clamp-2 text-xs text-muted">{item.message}</p>
                                  <p className="mt-1 text-[11px] text-muted">
                                    {formatNotificationTime(item.createdAt)}
                                  </p>
                                </div>
                                {!item.isRead ? (
                                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-indigo-600" />
                                ) : null}
                              </div>
                            </button>
                          ))
                        ) : (
                          <p className="px-4 py-6 text-center text-sm text-muted">No notifications yet</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationOpen(false);
                      setOpen((s) => !s);
                    }}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                    aria-label="Open profile menu"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                      />
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                        {user ? initials : <FiUser className="h-4 w-4" />}
                      </span>
                    )}
                    <span className="hidden text-sm font-semibold sm:inline-block">
                      {displayName}
                    </span>
                    <FiChevronDown className="h-4 w-4 opacity-70" />
                  </button>

                  {open && (
                    <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-base bg-surface shadow-lg">
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-basec">{displayName}</p>

                          <span
                            className={`text-[10px] px-2 py-[2px] rounded-full border font-medium
                            ${
                              user?.currentPlan === "Pro"
                                ? "border-[#F4C430] text-black bg-[#F4C430]"
                                : "border-[#50C878] text-black bg-[#50C878]"
                            }`}
                          >
                            {user?.currentPlan ?? "Free"}
                          </span>
                        </div>

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

                      <button
                        type="button"
                        onClick={() => go("/profile")}
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-sm text-basec hover:bg-[rgb(var(--bg))]"
                      >
                        <FiUser className="h-4 w-4" />
                        Profile
                      </button>

                      <button
                        type="button"
                        onClick={() => go("/wallet")}
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-sm text-basec hover:bg-[rgb(var(--bg))]"
                      >
                        <FiCreditCard className="h-4 w-4" />
                        Wallet
                      </button>

                      {isInstructor ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              go(instructorVerified ? "/instructor/dashboard" : "/instructor/verify")
                            }
                            className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-sm text-basec hover:bg-[rgb(var(--bg))]"
                          >
                            <FiGrid className="h-4 w-4" />
                            {instructorVerified ? "Instructor Dashboard" : "Verify Instructor"}
                          </button>
                        </>
                      ) : null}

                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => go("/admin")}
                          className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-sm text-basec hover:bg-[rgb(var(--bg))]"
                        >
                          <FiShield className="h-4 w-4" />
                          Admin Dashboard
                        </button>
                      ) : null}

                      <div className="h-px bg-base" />

                      <button
                        type="button"
                        onClick={logout}
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-sm text-basec hover:bg-[rgb(var(--bg))]"
                      >
                        <FiLogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {mobileOpen && (
          <div className="absolute left-0 right-0 top-full z-[60] md:hidden">
            <div className="border-t border-gray-200 bg-white py-3 shadow-lg dark:border-gray-800 dark:bg-gray-900">
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-800">
                {!isLoggedIn ? (
                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex flex-1 items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Get Started
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-base bg-surface">
                    <div className="px-4 py-3">
                      <p className="text-sm font-semibold text-basec">{displayName}</p>
                      <p className="text-xs text-muted">{user?.email}</p>
                      <p className="mt-1 text-xs text-muted">
                        {isAdmin
                          ? "Admin"
                          : isInstructor
                          ? instructorVerified
                            ? "Verified Instructor"
                            : "Instructor (Unverified)"
                          : "Student"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-basec">
                        Plan: {user?.currentPlan ?? "Free"} ({user?.planStatus ?? "Active"})
                      </p>
                    </div>

                    <div className="h-px bg-base" />

                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        go("/profile");
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-sm text-basec hover:bg-[rgb(var(--bg))]"
                    >
                      <FiUser className="h-4 w-4" />
                      Profile
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        go("/wallet");
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-sm text-basec hover:bg-[rgb(var(--bg))]"
                    >
                      <FiCreditCard className="h-4 w-4" />
                      Wallet
                    </button>

                    {isInstructor ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setMobileOpen(false);
                            go(instructorVerified ? "/instructor/dashboard" : "/instructor/verify");
                          }}
                          className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-sm text-basec hover:bg-[rgb(var(--bg))]"
                        >
                          <FiGrid className="h-4 w-4" />
                          {instructorVerified ? "Instructor Dashboard" : "Verify Instructor"}
                        </button>
                      </>
                    ) : null}

                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          go("/admin");
                        }}
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-sm text-basec hover:bg-[rgb(var(--bg))]"
                      >
                        <FiShield className="h-4 w-4" />
                        Admin Dashboard
                      </button>
                    ) : null}

                    <div className="h-px bg-base" />

                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        logout();
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-sm text-basec hover:bg-[rgb(var(--bg))]"
                    >
                      <FiLogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
