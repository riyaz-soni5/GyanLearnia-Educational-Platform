// src/services/adminUsers.ts
import { http } from "./http";

export type UserRole = "student" | "instructor" | "admin";

// ✅ what UI uses for filtering + role-change
export type AdminRoleKey =
  | "student"
  | "admin"
  | "verified_instructor"
  | "unverified_instructor";

export type AdminRoleFilter = AdminRoleKey | "All";

export type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;

  // raw backend fields
  role: UserRole;
  isVerified: boolean;
  verificationStatus: "NotSubmitted" | "Pending" | "Rejected" | "Verified";

  points: number;
  acceptedAnswers: number;
  joinedAt: string;
};

export type AdminUsersListResponse = {
  items: AdminUser[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function fetchAdminUsers(params: {
  q?: string;
  role?: AdminRoleFilter;
  page?: number;
  limit?: number;
}): Promise<AdminUsersListResponse> {
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set("q", params.q.trim());

  if (params.role && params.role !== "All") sp.set("role", params.role);

  sp.set("page", String(params.page ?? 1));
  sp.set("limit", String(params.limit ?? 10));

  return http<AdminUsersListResponse>(`/api/admin/users?${sp.toString()}`);
}

export async function deleteUserById(id: string) {
  return http<{ message: string; id: string }>(`/api/admin/users/${id}`, {
    method: "DELETE",
  });
}

export async function updateUserRoleById(id: string, role: AdminRoleKey) {
  return http<{
    id: string;
    role: UserRole;
    isVerified: boolean;
    verificationStatus: "NotSubmitted" | "Pending" | "Rejected" | "Verified";
  }>(`/api/admin/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}