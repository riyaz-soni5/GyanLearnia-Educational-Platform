import { http } from "./http";
import type { CourseListItem } from "@/app/types/course.type";

export async function listPublishedCourses() {
  return http<{ items: CourseListItem[] }>(`/api/courses`);
}