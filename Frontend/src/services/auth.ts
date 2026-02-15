// src/services/auth.ts
const API_URL = import.meta.env.VITE_API_BASE_URL;

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    role: "student" | "instructor" | "admin";
    email: string;
    firstName?: string;
    lastName?: string;
  };
};

export async function loginApi(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },

    // ✅ allow browser to receive/set cookies from backend
    credentials: "include",

    body: JSON.stringify({ email, password, rememberMe }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Login failed");
  return data;
}