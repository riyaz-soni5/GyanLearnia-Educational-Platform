// src/services/questions.ts
import type { Question } from "@/app/types/question.types";
import { http } from "./http";

// ---------- Types ----------
export type AnswerDTO = {
  id: string;
  questionId: string;
  content: string;
  votes: number;
  myVote?: 1 | -1 | null;
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

export async function updateAnswer(questionId: string, answerId: string, content: string) {
  return http(`/api/questions/${questionId}/answers/${answerId}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
}


export async function deleteAnswer(questionId: string, answerId: string) {
  return http(`/api/questions/${questionId}/answers/${answerId}`, {
    method: "DELETE",
  });
}

export async function updateQuestion(
  questionId: string,
  payload: { title: string; excerpt: string }
) {
  return http(`/api/questions/${questionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteQuestion(questionId: string) {
  return http(`/api/questions/${questionId}`, {
    method: "DELETE",
  });
}


export async function upvoteAnswer(questionId: string, answerId: string) {
  return http<{ message: string; votes: number; myVote: 1 | -1 | null }>(
    `/api/questions/${questionId}/answers/${answerId}/upvote`,
    { method: "POST" }
  );
}

export async function downvoteAnswer(questionId: string, answerId: string) {
  return http<{ message: string; votes: number; myVote: 1 | -1 | null }>(
    `/api/questions/${questionId}/answers/${answerId}/downvote`,
    { method: "POST" }
  );
}

export async function upvoteQuestion(questionId: string) {
  return http<{ message: string; votes: number; myVote: 1 | -1 | null }>(
    `/api/questions/${questionId}/upvote`,
    { method: "POST" }
  );
}

export async function downvoteQuestion(questionId: string) {
  return http<{ message: string; votes: number; myVote: 1 | -1 | null }>(
    `/api/questions/${questionId}/downvote`,
    { method: "POST" }
  );
}

export type ReplyDTO = {
  id: string;
  questionId: string;
  answerId: string;
  parentReplyId: string | null;
  content: string;
  votes: number;
  myVote?: 1 | -1 | null;
  createdAt: string;
  updatedAt?: string;
  author?: string;
  authorType?: string;
  authorId?: string;
};

export async function fetchReplies(
  questionId: string,
  answerId: string,
  params?: { parentId?: string | null; limit?: number; cursor?: string | null }
): Promise<{ items: ReplyDTO[]; hasMore: boolean; nextCursor: string | null }> {
  const qs = new URLSearchParams();
  if (params?.parentId !== undefined) qs.set("parentId", params.parentId ?? "null");
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.cursor) qs.set("cursor", String(params.cursor));
  const q = qs.toString() ? `?${qs.toString()}` : "";
  return http(`/api/questions/${questionId}/answers/${answerId}/replies${q}`);
}

export async function postReply(
  questionId: string,
  answerId: string,
  content: string,
  parentReplyId: string | null = null
): Promise<{ item: ReplyDTO }> {
  return http(`/api/questions/${questionId}/answers/${answerId}/replies`, {
    method: "POST",
    body: JSON.stringify({ content, parentReplyId }),
  });
}

export async function updateReply(
  questionId: string,
  answerId: string,
  replyId: string,
  content: string
): Promise<any> {
  return http(`/api/questions/${questionId}/answers/${answerId}/replies/${replyId}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
}

export async function deleteReply(
  questionId: string,
  answerId: string,
  replyId: string
): Promise<any> {
  return http(`/api/questions/${questionId}/answers/${answerId}/replies/${replyId}`, {
    method: "DELETE",
  });
}

export async function upvoteReply(questionId: string, answerId: string, replyId: string) {
  return http(`/api/questions/${questionId}/answers/${answerId}/replies/${replyId}/upvote`, {
    method: "POST",
  });
}

export async function downvoteReply(questionId: string, answerId: string, replyId: string) {
  return http(`/api/questions/${questionId}/answers/${answerId}/replies/${replyId}/downvote`, {
    method: "POST",
  });
}



export async function acceptAnswer(questionId: string, answerId: string) {
  return http<{ message: string; acceptedAnswerId: string | null; hasVerifiedAnswer: boolean }>(
    `/api/questions/${questionId}/answers/${answerId}/accept`,
    { method: "POST" }
  );
}