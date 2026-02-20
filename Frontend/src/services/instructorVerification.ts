import { http } from "./http";

export type VerificationStatus = "NotSubmitted" | "Pending" | "Rejected" | "Verified";

export type MyVerificationRes = {
  status: VerificationStatus;
  isVerified: boolean;
  reason: string | null;
  submittedAt: string | null;
};

export function getMyVerification() {
  return http<MyVerificationRes>("/api/instructor-verification/me");
}

export function submitVerification() {
  return http<{ message: string; status: VerificationStatus }>("/api/instructor-verification/submit", {
    method: "POST",
    body: JSON.stringify({}),
  });
}