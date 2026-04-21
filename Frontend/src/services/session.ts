import { fetchCurrentUserProfile } from "./userProfile";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const STORAGE_KEY = "gyanlearnia_user";
let restoringUserPromise: Promise<SessionUser | null> | null = null;

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

function persistUser(user: SessionUser, rememberMe: boolean) {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(STORAGE_KEY, JSON.stringify(user));
  dispatchUserUpdated();
}

function dispatchUserUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("gyanlearnia_user_updated"));
  }
}

function storeUserInSession(user: SessionUser) {
  persistUser(user, false);
}

export function setUser(user: SessionUser, rememberMe: boolean) {
  persistUser(user, rememberMe);
}

export function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  dispatchUserUpdated();
}

function toSessionUser(profile: Awaited<ReturnType<typeof fetchCurrentUserProfile>>): SessionUser {
  return {
    id: profile.id,
    role: profile.role,
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    avatarUrl: profile.avatarUrl ?? null,
    isVerified: profile.isVerified,
    verificationStatus: profile.verificationStatus,
    currentPlan: profile.currentPlan,
    planStatus: profile.planStatus,
    planActivatedAt: profile.planActivatedAt ?? null,
    planExpiresAt: profile.planExpiresAt ?? null,
    walletBalancePaisa: profile.walletBalancePaisa,
    walletBalance: profile.walletBalance,
  };
}

function isAuthError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = String(error.message || "").toLowerCase();
  return (
    message.includes("unauthorized") ||
    (message.includes("token") && (message.includes("invalid") || message.includes("expired")))
  );
}

export async function refreshSessionUser(): Promise<SessionUser | null> {
  try {
    const profile = await fetchCurrentUserProfile();
    const restoredUser = toSessionUser(profile);
    const rememberMe = Boolean(localStorage.getItem(STORAGE_KEY));
    persistUser(restoredUser, rememberMe);
    return restoredUser;
  } catch (error) {
    if (isAuthError(error)) {
      clearUser();
      return null;
    }
    throw error;
  }
}

export async function ensureSessionUser(): Promise<SessionUser | null> {
  const existing = getUser();
  if (existing?.id) return existing;

  if (restoringUserPromise) return restoringUserPromise;

  restoringUserPromise = (async () => {
    try {
      const profile = await fetchCurrentUserProfile();
      const restoredUser = toSessionUser(profile);

      storeUserInSession(restoredUser);
      return restoredUser;
    } catch (error) {
      if (isAuthError(error)) {
        clearUser();
        return null;
      }
      return null;
    } finally {
      restoringUserPromise = null;
    }
  })();

  return restoringUserPromise;
}

export async function logout() {
  clearUser();

  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore logout request error
  }
}
