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
};

export async function createCourse(draft: CourseDraft) {
  return http<{ item: { id: string; status: string } }>(`/api/instructor/courses`, {
    method: "POST",
    body: JSON.stringify({ draft }), // ✅ backend expects { draft: CourseDraft }
  });
}

export async function listMyCourses() {
  return http<{ items: MyInstructorCourse[] }>(`/api/instructor/courses/mine`);
}
