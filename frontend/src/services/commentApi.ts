import { api, type Comment } from "@/services/api";

export async function getComments(postId: number) {
  const response = await api.get<Comment[]>(`/review-posts/${postId}/comments`);
  return response.data;
}

export async function createComment(postId: number, content: string) {
  const response = await api.post<Comment>(`/review-posts/${postId}/comments`, { content });
  return response.data;
}

export async function replyComment(postId: number, commentId: number, content: string) {
  const response = await api.post<Comment>(`/review-posts/${postId}/comments/${commentId}/replies`, { content });
  return response.data;
}

export async function updateComment(postId: number, commentId: number, content: string) {
  const response = await api.patch<Comment>(`/review-posts/${postId}/comments/${commentId}`, { content });
  return response.data;
}

export async function deleteComment(postId: number, commentId: number) {
  await api.delete(`/review-posts/${postId}/comments/${commentId}`);
}

export async function likeComment(postId: number, commentId: number) {
  const response = await api.post(`/review-posts/${postId}/comments/${commentId}/like`);
  return response.data;
}

export async function unlikeComment(postId: number, commentId: number) {
  const response = await api.delete(`/review-posts/${postId}/comments/${commentId}/like`);
  return response.data;
}

export async function reportComment(postId: number, commentId: number, payload: { reason: "spam" | "offensive" | "harassment" | "other"; detail?: string }) {
  const response = await api.post(`/review-posts/${postId}/comments/${commentId}/reports`, payload);
  return response.data;
}
