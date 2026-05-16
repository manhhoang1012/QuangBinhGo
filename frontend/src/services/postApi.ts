import axios from "axios";

import { api, authStorage, type ReviewPost } from "@/services/api";

export interface CreatePostPayload {
  title: string;
  content: string;
  place_id: number;
  images: string[];
}

export type UpdatePostPayload = Partial<CreatePostPayload>;

export type FeedSort = "latest" | "popular";

export async function getCommunityFeed(sort: FeedSort = "latest") {
  const response = await api.get<ReviewPost[]>("/review-posts/feed", { params: { sort } });
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

export async function uploadPostImages(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const token = authStorage.getToken();
  const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
  const response = await axios.post<{ urls: string[] }>(`${baseURL}/review-posts/uploads`, formData, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data.urls;
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

export async function reportPost(postId: number, reason: string, description?: string) {
  const response = await api.post(`/review-posts/${postId}/reports`, { reason, description });
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

export function sharePost(postId: number) {
  const url = `${window.location.origin}/community/${postId}`;
  if (navigator.share) {
    return navigator.share({ title: "QuangBinhGo", url });
  }
  return navigator.clipboard.writeText(url);
}

export function getSavedPostIds() {
  return [] as number[];
}

export function getLikedPostIds() {
  return [] as number[];
}
