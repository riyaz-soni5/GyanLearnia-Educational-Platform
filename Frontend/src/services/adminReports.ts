import { http } from "./http";

export type AdminReportTrendPoint = {
  date: string;
  users: number;
  questions: number;
  answers: number;
  enrollments: number;
  purchases: number;
  revenueNpr: number;
};

export type AdminReportSummary = {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  verifiedInstructors: number;
  totalQuestions: number;
  totalAnswers: number;
  totalCourses: number;
  publishedCourses: number;
  pendingCourseApprovals: number;
  pendingInstructorVerifications: number;
  totalEnrollments: number;
  completedEnrollments: number;
  totalPurchases: number;
  totalRevenueNpr: number;
  answeredQuestionRate: number;
  verifiedAnswerRate: number;
  averageAnswersPerQuestion: number;
  courseCompletionRate: number;
};

export type AdminReportWindow = {
  startDate: string;
  endDate: string;
  users: number;
  questions: number;
  answers: number;
  enrollments: number;
  purchases: number;
  revenueNpr: number;
  previous: {
    users: number;
    questions: number;
    answers: number;
    enrollments: number;
    purchases: number;
    revenueNpr: number;
  };
};

export type AdminTopCourse = {
  id: string;
  title: string;
  instructorName: string;
  enrollments: number;
  purchases: number;
  revenueNpr: number;
  averageRating: number;
  reviewCount: number;
};

export type AdminTopInstructor = {
  id: string;
  name: string;
  email: string;
  publishedCourses: number;
  enrollments: number;
  purchases: number;
  revenueNpr: number;
};

export type AdminRevenueTransaction = {
  id: string;
  pidx: string;
  createdAt: string;
  course: {
    id: string;
    title: string;
  };
  learner: {
    id: string;
    name: string;
    email: string;
  };
  instructor: {
    id: string;
    name: string;
    email: string;
  };
  grossAmountNpr: number;
  platformFeeNpr: number;
  instructorShareNpr: number;
};

export type AdminReportsInsightsResponse = {
  generatedAt: string;
  windowDays: number;
  summary: AdminReportSummary;
  window: AdminReportWindow;
  trends: AdminReportTrendPoint[];
  topCourses: AdminTopCourse[];
  topInstructors: AdminTopInstructor[];
  revenueTransactions: AdminRevenueTransaction[];
  insights: string[];
};

export async function fetchAdminReportInsights(days: number) {
  const qs = new URLSearchParams({ days: String(days) });
  return http<AdminReportsInsightsResponse>(`/api/admin/reports/insights?${qs.toString()}`);
}
