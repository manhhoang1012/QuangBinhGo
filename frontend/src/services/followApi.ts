import { api, type ReviewPost, type User } from "@/services/api";

export interface FollowStatus {
  username?: string | null;
  is_following: boolean;
  is_self: boolean;
  followers_count: number;
  following_count: number;
}

export interface FollowActionResponse extends FollowStatus {
  changed: boolean;
  message: string;
}

export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export async function followUser(username: string) {
  const response = await api.post<FollowActionResponse>(`/users/${username}/follow`);
  return response.data;
}

export async function unfollowUser(username: string) {
  const response = await api.delete<FollowActionResponse>(`/users/${username}/follow`);
  return response.data;
}

export async function getFollowStatus(username: string) {
  const response = await api.get<FollowStatus>(`/users/${username}/follow-status`);
  return response.data;
}

export async function getFollowers(username: string, params: { page?: number; limit?: number } = {}) {
  const response = await api.get<PaginatedUsers>(`/users/${username}/followers`, { params });
  return response.data;
}

export async function getFollowing(username: string, params: { page?: number; limit?: number } = {}) {
  const response = await api.get<PaginatedUsers>(`/users/${username}/following`, { params });
  return response.data;
}

export async function getFollowSuggestions(params: { page?: number; limit?: number } = {}) {
  const response = await api.get<PaginatedUsers>("/users/suggestions/follow", { params });
  return response.data;
}

export async function getPublicUserProfile(username: string) {
  const response = await api.get<User & { recent_posts?: ReviewPost[] }>(`/users/${username}/public-profile`);
  return response.data;
}

export async function getFollowingFeed(params: { page?: number; skip?: number; limit?: number } = {}) {
  const response = await api.get<ReviewPost[]>("/review-posts/feed/following", { params });
  return response.data;
}
