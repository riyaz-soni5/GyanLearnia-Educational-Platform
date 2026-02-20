// src/services/session.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export type SessionUser = {
  id: string;
  role: "student" | "instructor" | "admin";
  email: string;
  firstName?: string;
  lastName?: string;
  isVerified?: boolean; // ✅ needed for instructor gating
};

// ✅ get logged user
export function getUser(): SessionUser | null {
  const raw =
    localStorage.getItem("gyanlearnia_user") ||
    sessionStorage.getItem("gyanlearnia_user");

  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

// ✅ check login (must have id)
export function isLoggedIn() {
  const u = getUser();
  return Boolean(u?.id);
}

// ✅ store user (login)
export function setUser(user: SessionUser, rememberMe: boolean) {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem("gyanlearnia_user", JSON.stringify(user));
}

// ✅ logout
export async function logout() {
  localStorage.removeItem("gyanlearnia_user");
  sessionStorage.removeItem("gyanlearnia_user");

  // clear cookie on backend
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore network errors (still logged out on frontend)
  }
}