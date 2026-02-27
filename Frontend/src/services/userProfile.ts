import { http } from "./http";

export type UserRole = "student" | "instructor" | "admin";

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  dateOfBirth?: string | null;
  gender?: "" | "male" | "female" | "other" | "prefer_not_to_say";
  avatarUrl?: string | null;
  bio?: string;
  interests?: string[];
  academicBackgrounds?: Array<{
    institution: string;
    startDate: string;
    endDate?: string | null;
    isCurrent?: boolean;
  }>;
  expertise?: string;
  institution?: string;
  isVerified?: boolean;
  verificationStatus?: "NotSubmitted" | "Pending" | "Rejected" | "Verified";
  stats?: {
    enrolledCoursesCount: number;
    completedCoursesCount: number;
    certificatesCount: number;
    points: number;
    badge: string;
    enrolledCourses: Array<{ id: string; title: string; thumbnailUrl?: string | null }>;
    completedCourses: Array<{ id: string; title: string; thumbnailUrl?: string | null }>;
  };
};

export type UpdateUserProfilePayload = {
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: "" | "male" | "female" | "other" | "prefer_not_to_say" | null;
  bio?: string;
  interests?: string[];
  academicBackgrounds?: Array<{
    institution: string;
    startDate: string;
    endDate?: string | null;
    isCurrent?: boolean;
  }>;
  avatarUrl?: string | null;
  expertise?: string;
  institution?: string;
};

export async function fetchCurrentUserProfile() {
  return http<UserProfile>("/api/user/me");
}

export async function updateCurrentUserProfile(payload: UpdateUserProfilePayload) {
  return http<UserProfile>("/api/user/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }) {
  return http<{ message: string }>("/api/user/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
