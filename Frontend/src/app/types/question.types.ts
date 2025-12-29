export type QuestionStatus = "Answered" | "Unanswered";

export type QuestionTag =
  | "SEE"
  | "+2"
  | "Class 9"
  | "Math"
  | "Physics"
  | "Chemistry"
  | "English"
  | "Accountancy"
  | "Notes"
  | "Exam";

export type Question = {
  id: string;
  title: string;
  excerpt: string;
  subject: string;
  level: string; // keep flexible
  tags: QuestionTag[];
  author: string;
  authorType?: "Student" | "Tutor" | "Teacher";
  answersCount: number;
  views: number;
  votes: number;
  status: QuestionStatus;
  createdAt: string; // "2h ago" (static)
  hasVerifiedAnswer?: boolean;
  isFastResponse?: boolean;
};
