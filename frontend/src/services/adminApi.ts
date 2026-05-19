import { api, type Category, type Place, type ReviewPost, type User } from "@/services/api";
import { getAdminReports as getUnifiedAdminReports, rejectReport as rejectUnifiedReport, resolveReport as resolveUnifiedReport, type ReportList, type ReportRead } from "@/services/reportApi";
import { type PlacePayload } from "@/services/placeApi";
import { uploadFiles } from "@/services/uploadApi";

export interface AdminStats {
  total_users: number;
  total_places: number;
  total_posts: number;
  total_comments: number;
  total_reviews: number;
  total_likes: number;
  total_reports: number;
  pending_reports: number;
  featured_posts: ReviewPost[];
  popular_places: Place[];
  recent_activities: Array<{ type: string; title: string; actor: string; target: string; created_at: string }>;
}

export type AdminReport = ReportRead;
export type AdminReportList = ReportList;

export interface AdminAuditLog {
  id: number;
  actor?: User | null;
  actor_id?: number | null;
  action: string;
  target_type: string;
  target_id?: number | null;
  metadata?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface AdminAuditLogList {
  items: AdminAuditLog[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AdminComment {
  id: number;
  content: string;
  status: string;
  report_count: number;
  like_count: number;
  author: User;
  post: ReviewPost;
  reports: Array<{ id: number; reason: string; detail?: string | null; status: string; created_at: string; reporter?: User | null }>;
  created_at: string;
}

export interface AdminReview {
  id: number;
  author: User;
  place: Place;
  rating: number;
  content: string;
  status: string;
  report_count: number;
  helpful_count: number;
  reports?: Array<{ id: number; reason: string; detail?: string | null; status: string; created_at: string; reporter?: User | null }>;
  created_at: string;
  updated_at: string;
}

export async function getAdminStats() {
  const response = await api.get<AdminStats>("/admin/dashboard/stats");
  return response.data;
}

export async function getAdminOverview() {
  const [stats, places, posts, users] = await Promise.all([
    getAdminStats(),
    getAdminPlaces({ limit: 100 }),
    getAdminPosts({ limit: 50 }),
    getAdminUsers({}),
  ]);
  return { stats, places, posts, users };
}

export async function getAdminUsers(params: { search?: string; role?: string; is_active?: boolean; skip?: number; limit?: number } = {}) {
  const response = await api.get<User[]>("/admin/users", { params });
  return response.data;
}

export async function getAdminUser(id: number) {
  const response = await api.get<User>(`/admin/users/${id}`);
  return response.data;
}

export async function updateUserRole(id: number, role: "user" | "moderator" | "admin") {
  const response = await api.patch<User>(`/admin/users/${id}/role`, { role });
  return response.data;
}

export async function updateUserStatus(id: number, is_active: boolean) {
  const response = await api.patch<User>(`/admin/users/${id}/status`, { is_active });
  return response.data;
}

export async function deleteUser(id: number) {
  const response = await api.delete<{ message: string }>(`/admin/users/${id}`);
  return response.data;
}

export async function getAdminPlaces(params: { search?: string; category?: string; skip?: number; limit?: number } = {}) {
  const response = await api.get<Place[]>("/admin/places", { params });
  return response.data;
}

export async function createAdminPlace(data: PlacePayload) {
  const response = await api.post<Place>("/admin/places", data);
  return response.data;
}

export async function updateAdminPlace(id: number, data: Partial<PlacePayload>) {
  const response = await api.patch<Place>(`/admin/places/${id}`, data);
  return response.data;
}

export async function deleteAdminPlace(id: number) {
  const response = await api.delete<{ message: string }>(`/admin/places/${id}`);
  return response.data;
}

export async function uploadPlaceImages(files: File[]) {
  const response = await uploadFiles(files, "place_image");
  return response.urls;
}

export async function getAdminPosts(params: { search?: string; status?: string; reported?: boolean; featured?: boolean; skip?: number; limit?: number } = {}) {
  const response = await api.get<ReviewPost[]>("/admin/posts", { params });
  return response.data;
}

export async function updatePostStatus(id: number, status: string) {
  const response = await api.patch<ReviewPost>(`/admin/posts/${id}/status`, { status });
  return response.data;
}

export async function updatePostFeatured(id: number, is_featured: boolean) {
  const response = await api.patch<ReviewPost>(`/admin/posts/${id}/featured`, { is_featured });
  return response.data;
}

export async function deletePost(id: number) {
  const response = await api.delete<{ message: string }>(`/admin/posts/${id}`);
  return response.data;
}

export async function getAdminComments(params: { post_id?: number; user_id?: number; status?: string; skip?: number; limit?: number } = {}) {
  const response = await api.get<AdminComment[]>("/admin/comments", { params });
  return response.data;
}

export async function getAdminCommentReports(params: { status?: string; skip?: number; limit?: number } = {}) {
  const response = await api.get("/admin/comments/reports", { params });
  return response.data;
}

export async function getAdminReports(params: { type?: string; status?: string; reason?: string; skip?: number; limit?: number } = {}) {
  return getUnifiedAdminReports({ ...params, page: params.skip && params.limit ? Math.floor(params.skip / params.limit) + 1 : undefined });
}

export async function resolveReport(id: number, data: { type?: "post" | "comment" | "review" | "user"; status: "resolved" | "rejected"; action?: "none" | "hide_content" | "delete_content" | "warn_user" | "block_user"; resolution_note?: string }) {
  if (data.status === "resolved") return resolveUnifiedReport(id, { action: data.action ?? "none", resolution_note: data.resolution_note });
  return rejectUnifiedReport(id, { resolution_note: data.resolution_note });
}

export async function getAdminAuditLogs(params: { action?: string; actor_id?: number; target_type?: string; page?: number; limit?: number } = {}) {
  const response = await api.get<AdminAuditLogList>("/admin/audit-logs", { params });
  return response.data;
}

export async function updateCommentStatus(id: number, status: "visible" | "hidden" | "deleted" | "spam") {
  const response = await api.patch<AdminComment>(`/admin/comments/${id}/status`, { status });
  return response.data;
}

export async function deleteComment(id: number) {
  const response = await api.delete<{ message: string }>(`/admin/comments/${id}`);
  return response.data;
}

export async function getAdminReviews() {
  const response = await api.get<AdminReview[]>("/admin/reviews");
  return response.data;
}

export async function updatePlaceReviewStatus(id: number, status: "visible" | "hidden" | "deleted" | "reported") {
  const response = await api.patch<AdminReview>(`/admin/place-reviews/${id}/status`, { status });
  return response.data;
}

export async function deleteReview(id: number) {
  const response = await api.delete<{ message: string }>(`/admin/reviews/${id}`);
  return response.data;
}

export async function getAdminCategories() {
  const response = await api.get<Category[]>("/admin/categories");
  return response.data;
}

export async function createCategory(data: Omit<Category, "id">) {
  const response = await api.post<Category>("/admin/categories", data);
  return response.data;
}

export async function updateCategory(id: number, data: Partial<Omit<Category, "id">>) {
  const response = await api.patch<Category>(`/admin/categories/${id}`, data);
  return response.data;
}

export async function deleteCategory(id: number) {
  const response = await api.delete<{ message: string }>(`/admin/categories/${id}`);
  return response.data;
}
