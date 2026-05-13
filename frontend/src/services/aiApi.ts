import { api, type ReviewPost } from "@/services/api";

export interface AiSearchResult {
  score: number;
  post: ReviewPost;
}

export interface ItineraryRequest {
  days: number;
  interests: string[];
  travel_style: string;
  budget: string;
}

export async function searchReviewPosts(query: string, top_k = 5) {
  const response = await api.post<{ query: string; results: AiSearchResult[] }>("/ai/search", {
    query,
    top_k,
  });
  return response.data;
}

export async function generateItinerary(payload: ItineraryRequest) {
  const response = await api.post("/ai/itinerary", payload);
  return response.data;
}
