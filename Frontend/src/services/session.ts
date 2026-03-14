
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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


export function isLoggedIn() {
  const u = getUser();
  return Boolean(u?.id);
}


export function setUser(user: SessionUser, rememberMe: boolean) {
  // Ensure only one storage source is active at a time.
  localStorage.removeItem("gyanlearnia_user");
  sessionStorage.removeItem("gyanlearnia_user");
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem("gyanlearnia_user", JSON.stringify(user));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("gyanlearnia_user_updated"));
  }
}


export async function logout() {
  localStorage.removeItem("gyanlearnia_user");
  sessionStorage.removeItem("gyanlearnia_user");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("gyanlearnia_user_updated"));
  }


  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {

  }
}
