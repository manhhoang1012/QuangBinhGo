import { api, type Comment } from "@/services/api";

export async function getComments(postId: number) {
  const response = await api.get<Comment[]>(`/review-posts/${postId}/comments`);
  return response.data;
}

export async function createComment(postId: number, content: string) {
  const response = await api.post<Comment>(`/review-posts/${postId}/comments`, { content });
  return response.data;
}
