// src/app/api/courses.api.ts
import type { Course } from "../types/course.type";

export type Lesson = {
  id: string;
  title: string;
  durationMin: number;
  type: "Video" | "Note" | "Quiz";
  isPreview?: boolean;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

async function http<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const coursesApi = {
  list: (params?: { q?: string; level?: string; type?: string; price?: string }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.level && params.level !== "All") sp.set("level", params.level);
    if (params?.type && params.type !== "All") sp.set("type", params.type);
    if (params?.price && params.price !== "All") sp.set("priceType", params.price);
    const qs = sp.toString();
    return http<Course[]>(`/api/courses${qs ? `?${qs}` : ""}`);
  },

  getById: (id: string) => http<Course>(`/api/courses/${id}`),

  lessons: (id: string) => http<Lesson[]>(`/api/courses/${id}/lessons`),
};