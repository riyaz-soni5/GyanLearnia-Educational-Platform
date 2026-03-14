import { http } from "./http";

export type ContactSubmissionPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
};

export type ContactSubmissionItem = ContactSubmissionPayload & {
  id: string;
  userId?: string | null;
  createdAt: string;
};

export async function submitContactSubmission(payload: ContactSubmissionPayload) {
  return http<{ message: string; item: ContactSubmissionItem }>("/api/contact-submissions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listContactSubmissions() {
  return http<{ items: ContactSubmissionItem[] }>("/api/admin/contact-submissions");
}
