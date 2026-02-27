import { http } from "./http";

export type MentorMatch = {
  id: string;
  name: string;
  institution: string;
  expertise?: string | null;
  interests: string[];
  bio: string;
  avatarUrl?: string | null;
  mentorType?: "Verified Instructor" | "Top Ranked Student";
  matchScore?: number;
};

export type MentorMatchResponse = {
  mentor: MentorMatch | null;
  message?: string;
};

export type ConnectMentorResponse = {
  connectionId: string;
  status: "Pending" | "Accepted";
  chatRoomId?: string | null;
  message: string;
};

export async function findMentorMatch(tags: string[]) {
  const params = new URLSearchParams();
  tags.forEach((tag) => {
    const trimmed = String(tag ?? "").trim();
    if (trimmed) params.append("tags", trimmed);
  });

  const query = params.toString();
  return http<MentorMatchResponse>(`/api/mentors/match${query ? `?${query}` : ""}`);
}

export async function connectWithMentor(mentorId: string) {
  return http<ConnectMentorResponse>("/api/mentors/connect", {
    method: "POST",
    body: JSON.stringify({ mentorId }),
  });
}

export async function skipMentor(mentorId: string) {
  return http<{ message: string }>("/api/mentors/skip", {
    method: "POST",
    body: JSON.stringify({ mentorId }),
  });
}

export async function blockMentor(mentorId: string) {
  return http<{ message: string }>("/api/mentors/block", {
    method: "POST",
    body: JSON.stringify({ mentorId }),
  });
}
