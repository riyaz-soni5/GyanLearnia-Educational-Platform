// src/services/questions.ts
import type { Question } from "../app/types/question.types";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

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
  excerpt: string; // your UI uses excerpt as main question text
  subject: string;
  level: string;
  tags: string[];
  isFastResponse?: boolean;
};

export type CreateQuestionResponse = {
  message?: string;
  item: Question; // if your backend returns { item: createdQuestion }
  // OR if your backend returns { question: createdQuestion } then change to:
  // question: Question;
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

// ---------- Helper ----------
async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  // handle both json + non-json errors safely
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data as T;
}

// ---------- API calls ----------
export async function createQuestion(payload: CreateQuestionPayload) {
  return api<CreateQuestionResponse>(`/api/questions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}



export async function fetchQuestions(params?: {
  q?: string;
  subject?: string;
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
  return api<QuestionsListResponse>(`/api/questions${query ? `?${query}` : ""}`);
}

export async function fetchQuestion(id: string) {
  return api<QuestionDetailsResponse>(`/api/questions/${id}`);
}

export async function fetchAnswers(questionId: string) {
  return api<AnswersListResponse>(`/api/questions/${questionId}/answers`);
}

export async function postAnswer(questionId: string, content: string) {
  return api<PostAnswerResponse>(`/api/questions/${questionId}/answers`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}