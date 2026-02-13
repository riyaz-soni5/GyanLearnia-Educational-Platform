export type QuestionStatus = "Answered" | "Unanswered";

export type Question = {
  id: string;

  title: string;
  excerpt: string;

  // ✅ new (DB category)
  categoryId?: string;
  categoryName?: string;

  // ✅ keep temporarily for backward compatibility (remove later)
  subject?: string;

  level: string;

  // ✅ tags must be flexible (not union)
  tags: string[];

  author: string;
  authorType?: "Student" | "Tutor" | "Teacher" | "Instructor";

  answersCount: number;
  views: number;
  votes: number;

  status: QuestionStatus;

  // ✅ should come as ISO date from API
  createdAt: string;
  updatedAt?: string;

  hasVerifiedAnswer?: boolean;
  isFastResponse?: boolean;
};