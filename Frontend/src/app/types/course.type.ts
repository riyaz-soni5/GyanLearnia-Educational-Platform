export type CourseLevel = "Class 8" | "Class 9" | "Class 10 (SEE)" | "+2" | "Skill";
export type CourseType = "Academic" | "Technical" | "Vocational";
export type PriceType = "Free" | "Paid";

export type Course = {
  id: string;
  title: string;
  subtitle: string;
  level: CourseLevel;
  type: CourseType;
  priceType: PriceType;
  priceNpr?: number;
  rating: number;
  lessons: number;
  hours: number;
  instructorName: string;
  enrolled: number;
  badge?: "Popular" | "New" | "Certified";
};
