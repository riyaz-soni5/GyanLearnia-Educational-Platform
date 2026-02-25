export type LessonType = "Video" | "Quiz" | "File";

export const COURSE_CATEGORIES = ["Academic", "Technical", "Vocational", "Skill"] as const;
export const COURSE_LEVELS = [
  "Class 8",
  "Class 9",
  "Class 10 (SEE)",
  "+2",
  "Bachelor's",
  "Masters",
  "PhD",
  "Other",
] as const;
export const COURSE_SUBJECTS = [
  "Mathematics",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Nepali",
  "Accountancy",
  "Economics",
  "Computer Science",
  "Business Studies",
  "Other",
] as const;

export type LessonResource = {
  name: string;
  url: string;
  sizeBytes: number;
};

export type LessonDraft = {
  id: string;
  title: string;
  type: LessonType;
  durationMin: number;
  isPreview: boolean;

  // content
  videoUrl?: string;
  fileUrl?: string;

  resources: LessonResource[];

  // minimal quiz draft (upgrade later)
  quiz?: {
    title?: string;
    passPercent?: number;
    questions: Array<{
      q: string;
      options: string[];
      answerIndex: number;
      explanation?: string;
    }>;
  };
};

export type SectionDraft = {
  id: string;
  title: string;
  lessons: LessonDraft[];
};

export type CourseDraft = {
  title: string;
  subtitle: string;

  level: (typeof COURSE_LEVELS)[number];
  category: (typeof COURSE_CATEGORIES)[number];
  subject: (typeof COURSE_SUBJECTS)[number];
  tags: string[];

  priceType: "Free" | "Paid";
  priceNpr: number;

  language: "English" | "Nepali";
  thumbnailUrl?: string;

  description: string;
  outcomes: string[];
  requirements: string[];

  sections: SectionDraft[];
  lessons?: LessonDraft[]; // backward compatibility for older drafts
  certificate?: {
    enabled: boolean;
    templateImageUrl?: string;
    nameXPercent: number;
    nameYPercent: number;
    nameFontSizePx: number;
    nameColor: string;
  };
};

export type CourseStatus = "Draft" | "Pending" | "Published" | "Rejected";

export type CourseListItem = {
  id: string;
  title: string;
  subtitle: string;
  thumbnailUrl?: string;
  category: string;
  level: string;
  language: string;
  price: number;
  currency: string;
  tags?: string[];
  instructor?: {
    name?: string;
    email?: string;
    avatarUrl?: string | null;
  };
  totalLectures?: number;
  totalVideoSec?: number;
};

export type AdminCourseRow = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  level: string;
  language: string;
  price: number;
  currency: string;

  status: CourseStatus;
  rejectionReason?: string | null;

  instructor: {
    id: string;
    name: string;
    email: string;
  };

  totalLectures: number;
  totalVideoSec: number;
  createdAt: string;
};
