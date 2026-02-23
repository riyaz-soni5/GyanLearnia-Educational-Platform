// src/services/instructorCourse.ts
import { http } from "./http";
import type { CourseDraft } from "../app/types/course.type";

export type MyInstructorCourse = {
  id: string;
  title: string;
  subtitle: string;
  status: "Draft" | "Pending" | "Published" | "Rejected";
  rejectionReason?: string | null;
  createdAt: string;
  totalLectures: number;
  totalVideoSec: number;
  priceNpr?: number;
};

export type InstructorEditableCourse = {
  id: string;
  title: string;
  status: MyInstructorCourse["status"];
  rejectionReason?: string | null;
  createdAt: string;
  draft: CourseDraft;
};

export async function createCourse(draft: CourseDraft) {
  return http<{ item: { id: string; status: string } }>(`/api/instructor/courses`, {
    method: "POST",
    body: JSON.stringify({ draft }), // ✅ backend expects { draft: CourseDraft }
  });
}

export async function resubmitCourse(id: string, draft: CourseDraft) {
  return http<{ item: { id: string; status: string } }>(`/api/instructor/courses/${id}/resubmit`, {
    method: "PUT",
    body: JSON.stringify({ draft }),
  });
}

export async function listMyCourses() {
  return http<{ items: MyInstructorCourse[] }>(`/api/instructor/courses/mine`);
}

export async function getMyCourseById(id: string) {
  return http<{ item: InstructorEditableCourse }>(`/api/instructor/courses/${id}`);
}

export async function deleteCourse(id: string) {
  return http<{ message: string }>(`/api/instructor/courses/${id}`, {
    method: "DELETE",
  });
}
