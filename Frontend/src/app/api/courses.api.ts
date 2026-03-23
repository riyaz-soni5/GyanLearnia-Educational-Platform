import type { CourseListItem } from "../types/course.type";

export type Lesson = {
  id: string;
  title: string;
  durationMin: number;
  type: "Video" | "Quiz" | "File";
  isPreview?: boolean;
};

export type CourseListResponse =
  | { items: CourseListItem[]; total?: number; page?: number; limit?: number }
  | CourseListItem[];
export type CourseDetailsResponse = { item: Record<string, unknown> } | Record<string, unknown>;
export type CourseQuiz = {
  id: string;
  title: string;
  passPercent: number;
  questions: Array<{
    id: string;
    prompt: string;
    explanation: string;
    options: Array<{ id: string; text: string }>;
  }>;
};
export type CourseQuizResult = {
  quizId: string;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  passPercent: number;
  passed: boolean;
  details: Array<{
    questionId: string;
    selectedOptionId: string | null;
    correctOptionId: string | null;
    isCorrect: boolean;
    explanation: string;
  }>;
};
export type CourseProgress = {
  enrolled: boolean;
  completedCount: number;
  totalCount: number;
  percent: number;
  isCompleted: boolean;
  completedLectureIds: string[];
  quizScores: Record<string, number>;
  certificateEligible: boolean;
};
export type CourseCertificate = {
  courseId: string;
  courseTitle: string;
  studentName: string;
  completedOn: string;
  templateImageUrl: string;
  downloadUrl?: string;
  html: string;
};
export type CourseReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  isMine?: boolean;
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
};
export type CourseReviewsPayload = {
  averageRating: number;
  reviewsCount: number;
  items: CourseReview[];
};
export type CoursePurchaseInitPayload = {
  pidx: string;
  paymentUrl: string;
  expiresAt?: string | null;
  expiresIn?: number | null;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const coursesApi = {
  list: (params?: {
    q?: string;
    level?: string;
    type?: string;
    price?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set("q", params.q);
    if (params?.level && params.level !== "All") searchParams.set("level", params.level);
    if (params?.type && params.type !== "All") searchParams.set("type", params.type);
    if (params?.price && params.price !== "All") searchParams.set("priceType", params.price);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString();
    return http<CourseListResponse>(`/api/courses${qs ? `?${qs}` : ""}`);
  },

  getById: (id: string) => http<CourseDetailsResponse>(`/api/courses/${id}`),

  getQuiz: (courseId: string, quizId: string) =>
    http<{ item: CourseQuiz }>(`/api/courses/${courseId}/quizzes/${quizId}`),

  submitQuiz: (courseId: string, quizId: string, answers: Record<string, string>) =>
    http<{ item: CourseQuizResult }>(`/api/courses/${courseId}/quizzes/${quizId}/submit`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    }),

  enroll: (courseId: string) =>
    http<{ item: CourseProgress }>(`/api/courses/${courseId}/enroll`, {
      method: "POST",
      credentials: "include",
    }),

  initiatePurchase: (courseId: string, body: { returnUrl: string; websiteUrl: string }) =>
    http<{ item: CoursePurchaseInitPayload }>(`/api/courses/${courseId}/purchase/initiate`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  verifyPurchase: (courseId: string, pidx: string) =>
    http<{ item: CourseProgress }>(`/api/courses/${courseId}/purchase/verify`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pidx }),
    }),

  progress: (courseId: string) =>
    http<{ item: CourseProgress }>(`/api/courses/${courseId}/progress`, {
      credentials: "include",
    }),

  completeLecture: (courseId: string, lectureId: string) =>
    http<{ item: CourseProgress }>(`/api/courses/${courseId}/lectures/${lectureId}/complete`, {
      method: "POST",
      credentials: "include",
    }),

  getCertificate: (courseId: string) =>
    http<{ item: CourseCertificate }>(`/api/courses/${courseId}/certificate`, {
      credentials: "include",
    }),

  getReviews: (courseId: string) =>
    http<{ item: CourseReviewsPayload }>(`/api/courses/${courseId}/reviews`, {
      credentials: "include",
    }),

  submitReview: (courseId: string, body: { rating: number; comment: string }) =>
    http<{ item: CourseReview }>(`/api/courses/${courseId}/reviews`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  lessons: (id: string) => http<Lesson[]>(`/api/courses/${id}/lessons`),
};
