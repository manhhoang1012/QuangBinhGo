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

export function getSavedPostIds() {
  return [] as number[];
}

export function getLikedPostIds() {
  return [] as number[];
}
