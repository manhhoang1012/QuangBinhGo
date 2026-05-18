import { api } from "@/services/api";

export interface NotificationActor {
  id: number;
  username?: string | null;
  full_name: string;
  avatar_url?: string | null;
}

export type NotificationType =
  | "post_like"
  | "post_comment"
  | "comment_reply"
  | "user_follow"
  | "post_hidden"
  | "post_deleted"
  | "comment_like"
  | "review_report_resolved";

export interface NotificationItem {
  id: number;
  type: NotificationType | string;
  title: string;
  message: string;
  actor?: NotificationActor | null;
  target_type: string;
  target_id?: number | null;
  target_url?: string | null;
  metadata?: Record<string, unknown> | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface NotificationQuery {
  page?: number;
  limit?: number;
  unread_only?: boolean;
  type?: string;
}

export async function getNotifications(params: NotificationQuery = {}) {
  const response = await api.get<NotificationListResponse>("/notifications", { params });
  return response.data;
}

export async function getUnreadNotificationCount() {
  const response = await api.get<{ unread_count: number }>("/notifications/unread-count");
  return response.data.unread_count;
}

export async function markNotificationRead(id: number) {
  const response = await api.patch<NotificationItem>(`/notifications/${id}/read`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await api.patch<{ unread_count: number }>("/notifications/read-all");
  return response.data.unread_count;
}

export async function deleteNotification(id: number) {
  await api.delete(`/notifications/${id}`);
}
