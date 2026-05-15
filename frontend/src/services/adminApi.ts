import { api, type Category, type Place, type ReviewPost, type User } from "@/services/api";
import { type PlacePayload } from "@/services/placeApi";

export interface AdminStats {
  total_users: number;
  total_places: number;
  total_posts: number;
  total_comments: number;
  total_reviews: number;
  recent_activities: Array<{ type: string; title: string; actor: string; target: string; created_at: string }>;
}

export interface AdminComment {
  id: number;
  content: string;
  author: User;
  post: ReviewPost;
  created_at: string;
}

export interface AdminReview {
  id: number;
  author: User;
  place: Place;
  rating: number;
  content: string;
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
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const response = await api.post<{ urls: string[] }>("/admin/uploads/places", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.urls;
}

export async function getAdminPosts(params: { search?: string; skip?: number; limit?: number } = {}) {
  const response = await api.get<ReviewPost[]>("/admin/posts", { params });
  return response.data;
}

export async function updatePostStatus(id: number, status: string) {
  const response = await api.patch<ReviewPost>(`/admin/posts/${id}/status`, { status });
  return response.data;
}

export async function deletePost(id: number) {
  const response = await api.delete<{ message: string }>(`/admin/posts/${id}`);
  return response.data;
}

export async function getAdminComments(params: { post_id?: number; user_id?: number; skip?: number; limit?: number } = {}) {
  const response = await api.get<AdminComment[]>("/admin/comments", { params });
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
