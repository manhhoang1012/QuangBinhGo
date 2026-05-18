import { api, type ReviewPost, type User } from "@/services/api";
import { type AdminComment } from "@/services/adminApi";

export interface ModerationReport {
  id: number;
  type: "post" | "comment" | "review";
  reporter?: User | null;
  target_id: number;
  target_label: string;
  target_author?: User | null;
  reason: string;
  detail?: string | null;
  status: string;
  created_at: string;
}

export interface ModerationReportList {
  items: ModerationReport[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ModerationAction {
  id: number;
  moderator?: User | null;
  moderator_id: number;
  target_type: string;
  target_id: number;
  action_type: string;
  reason: string;
  note?: string | null;
  created_at: string;
}

export interface UserWarning {
  id: number;
  user?: User | null;
  user_id: number;
  moderator?: User | null;
  moderator_id: number;
  reason: string;
  message: string;
  related_target_type?: string | null;
  related_target_id?: number | null;
  is_read: boolean;
  created_at: string;
}

export interface ModerationDashboard {
  pending_reports: number;
  reported_posts: number;
  reported_comments: number;
  reported_reviews: number;
  recent_actions: ModerationAction[];
  recent_warnings: UserWarning[];
}

export interface ModerationReasonPayload {
  reason: string;
  note?: string | null;
}

export interface WarnUserPayload {
  reason: "spam" | "offensive" | "harassment" | "false_info" | "other";
  message: string;
  related_target_type?: "post" | "comment" | "review" | "user";
  related_target_id?: number;
}

export async function getModerationDashboard() {
  const response = await api.get<ModerationDashboard>("/moderation");
  return response.data;
}

export async function getModerationReports(params: { type?: string; status?: string; page?: number; limit?: number } = {}) {
  const response = await api.get<ModerationReportList>("/moderation/reports", { params });
  return response.data;
}

export async function getModerationReport(id: number, type: string) {
  const response = await api.get<ModerationReport>(`/moderation/reports/${id}`, { params: { type } });
  return response.data;
}

export async function resolveReport(id: number, data: { type: "post" | "comment" | "review"; reason: string; note?: string; hide_target?: boolean; warn_user?: boolean; warning_message?: string }) {
  const response = await api.patch(`/moderation/reports/${id}/resolve`, data);
  return response.data;
}

export async function rejectReport(id: number, data: { type: "post" | "comment" | "review"; reason: string; note?: string }) {
  const response = await api.patch(`/moderation/reports/${id}/reject`, data);
  return response.data;
}

export async function getReportedPosts(params: { status?: string } = {}) {
  const response = await api.get("/moderation/posts/reported", { params });
  return response.data;
}

export async function hidePost(postId: number, data: ModerationReasonPayload) {
  const response = await api.patch<ReviewPost>(`/moderation/posts/${postId}/hide`, data);
  return response.data;
}

export async function unhidePost(postId: number, data: ModerationReasonPayload = { reason: "unhide" }) {
  const response = await api.patch<ReviewPost>(`/moderation/posts/${postId}/unhide`, data);
  return response.data;
}

export async function getReportedComments(params: { status?: string } = {}) {
  const response = await api.get("/moderation/comments/reported", { params });
  return response.data;
}

export async function hideComment(commentId: number, data: ModerationReasonPayload) {
  const response = await api.patch<AdminComment>(`/moderation/comments/${commentId}/hide`, data);
  return response.data;
}

export async function unhideComment(commentId: number, data: ModerationReasonPayload = { reason: "unhide" }) {
  const response = await api.patch<AdminComment>(`/moderation/comments/${commentId}/unhide`, data);
  return response.data;
}

export async function warnUser(userId: number, data: WarnUserPayload) {
  const response = await api.post<UserWarning>(`/moderation/users/${userId}/warnings`, data);
  return response.data;
}

export async function getUserWarnings(userId: number) {
  const response = await api.get<UserWarning[]>(`/moderation/users/${userId}/warnings`);
  return response.data;
}

export async function getModerationActions(params: { target_type?: string; action_type?: string; moderator_id?: number; page?: number; limit?: number } = {}) {
  const response = await api.get<ModerationAction[]>("/moderation/actions", { params });
  return response.data;
}
