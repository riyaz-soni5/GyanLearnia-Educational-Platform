import { http } from "./http";

export type AppNotificationType =
  | "question_answered"
  | "answer_replied"
  | "reply_replied"
  | "instructor_verified"
  | "instructor_rejected"
  | "mentor_request"
  | "mentor_connection_accepted"
  | "mentor_connection_rejected"
  | "mentor_message"
  | "system";

export type AppNotification = {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
};

export type NotificationsResponse = {
  unreadCount: number;
  items: AppNotification[];
};

export async function fetchNotifications(limit = 20) {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(50, Math.floor(limit))) : 20;
  return http<NotificationsResponse>(`/api/notifications?limit=${safeLimit}`);
}

export async function markNotificationAsRead(notificationId: string) {
  return http<{ message: string; unreadCount: number }>(
    `/api/notifications/${notificationId}/read`,
    { method: "PATCH" }
  );
}

export async function markAllNotificationsAsRead() {
  return http<{ message: string; unreadCount: number }>("/api/notifications/read-all", {
    method: "POST",
  });
}
