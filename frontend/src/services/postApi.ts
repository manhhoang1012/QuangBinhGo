import { api, type ReviewPost } from "@/services/api";

export interface CreatePostPayload {
  title: string;
  content: string;
  place_id: number;
  images: string[];
}

export type FeedSort = "latest" | "popular";

export async function getCommunityFeed(sort: FeedSort = "latest") {
  const response = await api.get<ReviewPost[]>("/review-posts/feed", { params: { sort } });
  return response.data;
}

export async function createReviewPost(payload: CreatePostPayload) {
  const response = await api.post<ReviewPost>("/review-posts", payload);
  return response.data;
}

export async function likePost(postId: number) {
  const response = await api.post(`/review-posts/${postId}/likes`);
  const liked = JSON.parse(localStorage.getItem("liked_post_ids") ?? "[]") as number[];
  localStorage.setItem("liked_post_ids", JSON.stringify(Array.from(new Set([...liked, postId]))));
  return response.data;
}

export async function unlikePost(postId: number) {
  const response = await api.delete(`/review-posts/${postId}/likes`);
  const liked = JSON.parse(localStorage.getItem("liked_post_ids") ?? "[]") as number[];
  localStorage.setItem("liked_post_ids", JSON.stringify(liked.filter((id) => id !== postId)));
  return response.data;
}

export async function savePost(postId: number) {
  const response = await api.post(`/review-posts/${postId}/saves`);
  const saved = JSON.parse(localStorage.getItem("saved_post_ids") ?? "[]") as number[];
  localStorage.setItem("saved_post_ids", JSON.stringify(Array.from(new Set([...saved, postId]))));
  return response.data;
}

export async function unsavePost(postId: number) {
  const response = await api.delete(`/review-posts/${postId}/saves`);
  const saved = JSON.parse(localStorage.getItem("saved_post_ids") ?? "[]") as number[];
  localStorage.setItem("saved_post_ids", JSON.stringify(saved.filter((id) => id !== postId)));
  return response.data;
}

export function getSavedPostIds() {
  return JSON.parse(localStorage.getItem("saved_post_ids") ?? "[]") as number[];
}

export function getLikedPostIds() {
  return JSON.parse(localStorage.getItem("liked_post_ids") ?? "[]") as number[];
}
