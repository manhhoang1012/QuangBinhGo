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

export async function likeComment(commentId: number) {
  const response = await api.post(`/review-posts/comments/${commentId}/like`);
  return response.data;
}

export async function unlikeComment(commentId: number) {
  const response = await api.delete(`/review-posts/comments/${commentId}/like`);
  return response.data;
}
