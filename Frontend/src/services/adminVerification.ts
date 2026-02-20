// src/services/adminVerification.ts
import { http } from "./http";

export type VerificationStatus = "Pending" | "Verified" | "Rejected";

export type AdminVerificationItem = {
  id: string; // instructor userId
  fullName: string;
  email: string;
  expertise: string[];
  institute?: string;
  submittedAt: string; // ISO
  status: VerificationStatus;
  notes?: string;

  docs: {
    idCard: boolean;
    certificate: boolean;
    experienceLetter: boolean;
  };

  docIds: {
    idCard?: string;
    certificate?: string;
    experienceLetter?: string;
  };
};

export type ListRes = { items: AdminVerificationItem[] };

export async function listInstructorVerifications(params: {
  q?: string;
  status?: "All" | VerificationStatus;
}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.status) qs.set("status", params.status);
  const tail = qs.toString() ? `?${qs.toString()}` : "";
  return http<ListRes>(`/api/admin/instructor-verifications${tail}`);
}

export async function approveInstructor(id: string) {
  return http<{ message: string }>(`/api/admin/instructor-verifications/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function rejectInstructor(id: string, reason: string) {
  return http<{ message: string }>(`/api/admin/instructor-verifications/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}