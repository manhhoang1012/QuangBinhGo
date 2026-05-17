import { api, type User } from "@/services/api";
export { getFollowers, getFollowing, getFollowStatus, getPublicUserProfile } from "@/services/followApi";

export async function getCurrentProfile() {
  const response = await api.get<User>("/users/me");
  localStorage.setItem("auth_user", JSON.stringify(response.data));
  window.dispatchEvent(new Event("auth-change"));
  return response.data;
}

export type UpdateProfilePayload = Partial<
  Pick<User, "full_name" | "email" | "username" | "avatar_url" | "cover_image_url" | "bio" | "date_of_birth" | "gender" | "location" | "phone" | "phone_number" | "social_links">
>;

export async function updateCurrentProfile(payload: UpdateProfilePayload) {
  const response = await api.patch<User>("/users/me", payload);
  localStorage.setItem("auth_user", JSON.stringify(response.data));
  window.dispatchEvent(new Event("auth-change"));
  return response.data;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export async function changePassword(payload: ChangePasswordPayload) {
  const response = await api.patch<{ message: string }>("/users/me/password", payload);
  return response.data;
}

export async function updateAvatar(url: string) {
  const response = await api.patch<User>("/users/me/avatar", { url });
  localStorage.setItem("auth_user", JSON.stringify(response.data));
  window.dispatchEvent(new Event("auth-change"));
  return response.data;
}

export async function updateCoverImage(url: string) {
  const response = await api.patch<User>("/users/me/cover-image", { url });
  localStorage.setItem("auth_user", JSON.stringify(response.data));
  window.dispatchEvent(new Event("auth-change"));
  return response.data;
}

export async function deleteMyAccount() {
  const response = await api.delete<{ message: string }>("/users/me");
  return response.data;
}

export async function getPublicProfile(username: string) {
  const response = await api.get<User>(`/users/${username}`);
  return response.data;
}

export async function getMyPosts() {
  const response = await api.get<import("@/services/api").ReviewPost[]>("/users/me/posts");
  return response.data;
}

export async function getUserPosts(username: string, params: { page?: number; limit?: number } = {}) {
  const response = await api.get<import("@/services/api").ReviewPost[]>(`/users/${username}/posts`, { params });
  return response.data;
}

export async function getMySavedPosts() {
  const response = await api.get<import("@/services/api").ReviewPost[]>("/users/me/saved-posts");
  return response.data;
}

export async function getMyReviews() {
  const response = await api.get<Array<{ id: number; rating: number; content: string; place: import("@/services/api").Place; created_at: string }>>("/users/me/reviews");
  return response.data;
}
