export type CourseLevel = "Class 8" | "Class 9" | "Class 10 (SEE)" | "+2" | "Skill";
export type CourseType = "Academic" | "Technical" | "Vocational";
export type PriceType = "Free" | "Paid";

// src/app/types/course.type.ts
export type Course = {
  id: string;
  title: string;
  subtitle: string;
  level: string;
  type: string;
  priceType: "Free" | "Paid";
  priceNpr?: number;
  rating: number;
  lessons: number;
  hours: number;
  instructorName: string;
  enrolled: number;
  badge?: "Popular" | "Certified" | "New" | string;

  thumbnailUrl?: string; // ✅ add this
};