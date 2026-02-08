export type SessionUser = {
  id: string;
  role: "student" | "instructor" | "admin";
  email: string;
  firstName?: string;
  lastName?: string;
};

// ❌ REMOVE token functions (cookies handle auth now)

// get logged user
export function getUser(): SessionUser | null {
  const raw =
    localStorage.getItem("gyanlearnia_user") ||
    sessionStorage.getItem("gyanlearnia_user");

  return raw ? (JSON.parse(raw) as SessionUser) : null;
}

// check login
export function isLoggedIn() {
  return Boolean(getUser());
}

// logout
export function logout() {
  localStorage.removeItem("gyanlearnia_user");
  sessionStorage.removeItem("gyanlearnia_user");

  // call backend logout to clear cookie
  fetch("http://localhost:5000/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}