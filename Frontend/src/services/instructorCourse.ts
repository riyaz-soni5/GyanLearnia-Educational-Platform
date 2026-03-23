import { http } from "./http";
import type { CourseDraft } from "@/app/types/course.type";

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
  return http<{ item: { id: string; status: string } }>("/api/instructor/courses", {
    method: "POST",
    body: JSON.stringify({ draft }),
  });
}

export async function resubmitCourse(id: string, draft: CourseDraft) {
  return http<{ item: { id: string; status: string } }>(`/api/instructor/courses/${id}/resubmit`, {
    method: "PUT",
    body: JSON.stringify({ draft }),
  });
}

export async function listMyCourses() {
  return http<{ items: MyInstructorCourse[] }>("/api/instructor/courses/mine");
}

export type InstructorEarningsSummary = {
  totalIncomePaisa: number;
  totalIncomeNpr: number;
  payoutsCount: number;
  lastPayoutAt: string | null;
};

export async function getInstructorEarnings() {
  return http<InstructorEarningsSummary>("/api/instructor/courses/earnings");
}

export type InstructorAnalytics = {
  windowDays: number;
  revenueTrend: Array<{ date: string; revenueNpr: number; purchases: number }>;
  ratingTrend: Array<{ date: string; averageRating: number; reviews: number }>;
  courseEarnings: Array<{ courseId: string; title: string; earningsNpr: number; purchases: number }>;
  publishedCourseReviews: Array<{
    id: string;
    courseId: string;
    courseTitle: string;
    rating: number;
    comment: string;
    createdAt: string | null;
    reviewer: {
      name: string;
      avatarUrl: string | null;
    };
  }>;
};

export async function getInstructorAnalytics(days = 30) {
  const safeDays = Math.max(7, Math.min(90, Number(days || 30)));
  return http<InstructorAnalytics>(`/api/instructor/courses/analytics?days=${safeDays}`);
}

export async function getMyCourseById(id: string) {
  return http<{ item: InstructorEditableCourse }>(`/api/instructor/courses/${id}`);
}

export async function deleteCourse(id: string) {
  return http<{ message: string }>(`/api/instructor/courses/${id}`, {
    method: "DELETE",
  });
}
