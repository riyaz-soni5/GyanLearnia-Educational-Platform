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
  status: "Pending" | "Accepted" | "Rejected" | "Cancelled";
  chatRoomId?: string | null;
  message: string;
};

export type MentorConnectionStatus = "Pending" | "Accepted" | "Rejected" | "Cancelled";

export type MentorConnectionPeer = {
  id: string;
  name: string;
  role: "student" | "instructor" | "admin";
  avatarUrl?: string | null;
  institution?: string;
  expertise?: string | null;
};

export type MentorConnectionLastMessage = {
  content: string;
  senderId: string;
  createdAt: string;
};

export type MentorConnectionSummary = {
  connectionId: string;
  status: MentorConnectionStatus;
  requestedAt?: string | null;
  respondedAt?: string | null;
  acceptedAt?: string | null;
  isIncoming: boolean;
  peer: MentorConnectionPeer;
  chatRoomId?: string | null;
  lastMessage?: MentorConnectionLastMessage | null;
};

export type MentorConnectionListResponse = {
  incomingPending: MentorConnectionSummary[];
  outgoingPending: MentorConnectionSummary[];
  acceptedConnections: MentorConnectionSummary[];
};

export type MentorConnectionRespondResponse = {
  connectionId: string;
  status: MentorConnectionStatus;
  chatRoomId?: string | null;
  message: string;
};

export type MentorChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export type MentorChatMessagesResponse = {
  messages: MentorChatMessage[];
  nextCursor: string | null;
};

export type SendMentorMessageResponse = {
  message: MentorChatMessage;
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

export async function listMentorConnections() {
  return http<MentorConnectionListResponse>("/api/mentors/connections");
}

export async function respondToMentorConnection(connectionId: string, action: "accept" | "reject") {
  return http<MentorConnectionRespondResponse>(`/api/mentors/connections/${connectionId}/respond`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

export async function getConnectionMessages(connectionId: string, before?: string) {
  const params = new URLSearchParams();
  const cursor = String(before ?? "").trim();
  if (cursor) params.set("before", cursor);
  const query = params.toString();

  return http<MentorChatMessagesResponse>(
    `/api/mentors/connections/${connectionId}/messages${query ? `?${query}` : ""}`
  );
}

export async function sendConnectionMessage(connectionId: string, content: string) {
  return http<SendMentorMessageResponse>(`/api/mentors/connections/${connectionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
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
