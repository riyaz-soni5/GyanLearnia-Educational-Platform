const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const STORAGE_KEY = "gyanlearnia_user";

export type SessionUser = {
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
  walletBalancePaisa?: number;
  walletBalance?: number;
};

export function getUser(): SessionUser | null {
  const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return Boolean(getUser()?.id);
}

export function setUser(user: SessionUser, rememberMe: boolean) {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(STORAGE_KEY, JSON.stringify(user));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("gyanlearnia_user_updated"));
  }
}

export async function logout() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("gyanlearnia_user_updated"));
  }

  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore logout request error
  }
}
