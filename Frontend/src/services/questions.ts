// src/services/questions.ts
import type { Question } from "../app/types/question.types";
import { http } from "./http";

// ---------- Types ----------
export type AnswerDTO = {
  id: string;
  questionId: string;
  content: string;
  votes: number;
  isVerified?: boolean;
  createdAt: string;
  author: string;
  authorType?: "Student" | "Instructor" | "Tutor";
};

export type CreateQuestionPayload = {
  title: string;
  excerpt: string;
  categoryId: string; // ✅ changed
  level: string;
  tags: string[];
  isFastResponse?: boolean;
};

export type CreateQuestionResponse = {
  message?: string;
  item?: Question;
  question?: Question;
};

export type QuestionsListResponse = {
  items: Question[];
  total: number;
  page?: number;
  limit?: number;
};

export type QuestionDetailsResponse = {
  item: Question;
};

export type AnswersListResponse = {
  items: AnswerDTO[];
};

export type PostAnswerResponse = {
  message: string;
  answer: AnswerDTO;
};

// ---------- API calls ----------
export async function createQuestion(payload: CreateQuestionPayload) {
  return http<CreateQuestionResponse>(`/api/questions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchQuestions(params?: {
  q?: string;
  categoryId?: string; // ✅ new
  level?: string;
  sort?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();

  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (!s || s === "All") return;
    qs.set(k, s);
  });

  const query = qs.toString();
  return http<QuestionsListResponse>(`/api/questions${query ? `?${query}` : ""}`);
}

export async function fetchQuestion(id: string) {
  return http<QuestionDetailsResponse>(`/api/questions/${id}`);
}

export async function fetchAnswers(questionId: string) {
  return http<AnswersListResponse>(`/api/questions/${questionId}/answers`);
}

export async function postAnswer(questionId: string, content: string) {
  return http<PostAnswerResponse>(`/api/questions/${questionId}/answers`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}