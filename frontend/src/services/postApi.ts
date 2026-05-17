import axios from "axios";

import { api, authStorage, type ReviewPost } from "@/services/api";

export interface CreatePostPayload {
  title?: string;
  content: string;
  place_id?: number | null;
  images: string[];
  videos: string[];
  hashtags: string[];
  tagged_users: string[];
  visibility: "public" | "followers" | "private";
  is_draft: boolean;
}

export type UpdatePostPayload = Partial<CreatePostPayload>;
export type FeedType = "latest" | "trending" | "following" | "recommended" | "saved";
export type FeedSort = "latest" | "popular" | "trending";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function getCommunityFeed(type: FeedType = "latest", params: { skip?: number; limit?: number } = {}) {
  if (type === "saved") return getSavedPosts(params);
  const pathByType: Record<Exclude<FeedType, "saved">, string> = {
    latest: "/review-posts/feed/latest",
    trending: "/review-posts/feed/trending",
    following: "/review-posts/feed/following",
    recommended: "/review-posts/feed/recommended",
  };
  const response = await api.get<ReviewPost[]>(pathByType[type], { params });
  return response.data;
}

export async function getPlaceFeed(placeId: number, params: { skip?: number; limit?: number } = {}) {
  const response = await api.get<ReviewPost[]>(`/review-posts/feed/place/${placeId}`, { params });
  return response.data;
}

export async function getHashtagFeed(tag: string, params: { skip?: number; limit?: number } = {}) {
  const response = await api.get<ReviewPost[]>(`/review-posts/feed/hashtag/${tag}`, { params });
  return response.data;
}

export async function getSavedPosts(params: { skip?: number; limit?: number } = {}) {
  const response = await api.get<ReviewPost[]>("/users/me/saved-posts", { params });
  return response.data;
}

export async function getMyDrafts(params: { skip?: number; limit?: number } = {}) {
  const response = await api.get<ReviewPost[]>("/review-posts/drafts/me", { params });
  return response.data;
}

export async function createReviewPost(payload: CreatePostPayload) {
  const response = await api.post<ReviewPost>("/review-posts", payload);
  return response.data;
}

export async function getReviewPost(postId: number) {
  const response = await api.get<ReviewPost>(`/review-posts/${postId}`);
  return response.data;
}

export async function updateReviewPost(postId: number, payload: UpdatePostPayload) {
  const response = await api.patch<ReviewPost>(`/review-posts/${postId}`, payload);
  return response.data;
}

export async function deleteReviewPost(postId: number) {
  await api.delete(`/review-posts/${postId}`);
}

async function uploadFiles(files: File[], endpoint: string) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const token = authStorage.getToken();
  const response = await axios.post<{ urls: string[] }>(`${baseURL}${endpoint}`, formData, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data.urls;
}

export function uploadPostImages(files: File[]) {
  return uploadFiles(files, "/review-posts/uploads");
}

export function uploadPostVideos(files: File[]) {
  return uploadFiles(files, "/review-posts/uploads/videos");
}

export async function likePost(postId: number) {
  const response = await api.post(`/review-posts/${postId}/likes`);
  return response.data;
}

export async function unlikePost(postId: number) {
  const response = await api.delete(`/review-posts/${postId}/likes`);
  return response.data;
}

export async function savePost(postId: number) {
  const response = await api.post(`/review-posts/${postId}/saves`);
  return response.data;
}

export async function unsavePost(postId: number) {
  const response = await api.delete(`/review-posts/${postId}/saves`);
  return response.data;
}

export async function hidePost(postId: number) {
  const response = await api.post(`/review-posts/${postId}/hide`);
  return response.data;
}

export async function reportPost(postId: number, reason: string, description?: string) {
  const response = await api.post(`/review-posts/${postId}/reports`, { report_reason: reason, report_detail: description });
  return response.data;
}

export async function followUser(username: string) {
  const response = await api.post(`/users/${username}/follow`);
  return response.data;
}

export async function unfollowUser(username: string) {
  const response = await api.delete(`/users/${username}/follow`);
  return response.data;
}

export async function sharePost(postId: number) {
  await api.post(`/review-posts/${postId}/share`);
  const url = `${window.location.origin}/community/${postId}`;
  if (navigator.share) {
    return navigator.share({ title: "QuangBinhGo", url });
  }
  return navigator.clipboard.writeText(url);
}
