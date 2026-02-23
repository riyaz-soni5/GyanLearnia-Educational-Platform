import { http } from "./http";
import type { AdminCourseRow } from "../app/types/course.type";

export async function listPendingCourses() {
  return http<{ items: AdminCourseRow[] }>(`/api/admin/courses/pending`);
}

export async function approveCourse(id: string) {
  return http<{ message: string }>(`/api/admin/courses/${id}/approve`, { method: "POST" });
}

export async function rejectCourse(id: string, reason: string) {
  return http<{ message: string }>(`/api/admin/courses/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}