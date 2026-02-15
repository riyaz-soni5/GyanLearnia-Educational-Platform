export type QuestionStatus = "Answered" | "Unanswered";

export type Question = {
  id: string;
  title: string;
  excerpt: string;
  categoryId?: string;
  categoryName?: string;
  subject?: string;
  level: string;
  tags: string[];
  author: string;
  authorId: string;
  authorType?: "Student" | "Tutor" | "Teacher" | "Instructor";
  answersCount: number;
  views: number;
  votes: number;
  status: QuestionStatus;
  createdAt: string;
  updatedAt?: string;
  hasVerifiedAnswer?: boolean;
  isFastResponse?: boolean;
};