// src/services/http.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function http<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include", // ✅ cookie auth
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  // try to read json error
  if (!res.ok) {
    let msg = "Request failed";
    try {
      const data = await res.json();
      msg = data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}