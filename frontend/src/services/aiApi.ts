import { api, type Place, type ReviewPost } from "@/services/api";
import { type AiItinerary } from "@/services/itineraryApi";

export interface AiSearchResponse {
  query: string;
  intent: Record<string, unknown>;
  places: Place[];
  posts: ReviewPost[];
  results: Array<{ score: number; post: ReviewPost }>;
  source: "gemini" | "fallback";
}

export interface ItineraryRequest {
  days: number;
  interests: string[];
  travel_style: string;
  budget?: number | null;
  people_count?: number;
  start_location?: string;
}

export async function aiSearch(query: string, type: "all" | "places" | "posts" = "all", top_k = 8) {
  const response = await api.post<AiSearchResponse>("/ai/search", { query, type, top_k });
  return response.data;
}

export const searchReviewPosts = aiSearch;

export async function aiRecommendPlaces(payload: { interests: string[]; budget?: number; travel_style?: string; days?: number }) {
  const response = await api.post<{
    recommended_places: Array<{ place: Place; reason: string }>;
    estimated_budget?: number | null;
    suggested_region?: string | null;
    source: "gemini" | "fallback";
  }>("/ai/recommend/places", payload);
  return response.data;
}

export async function generateItinerary(payload: ItineraryRequest) {
  const response = await api.post<AiItinerary>("/ai/itinerary", payload);
  return response.data;
}

export async function aiChat(message: string) {
  const response = await api.post<{ answer: string; related_places: Place[]; related_posts: ReviewPost[]; source: "gemini" | "fallback" }>("/ai/chat", { message });
  return response.data;
}

export async function generateCaption(content: string) {
  const response = await api.post<{ captions: Record<string, string>; source: "gemini" | "fallback" }>("/ai/content/caption", { content });
  return response.data;
}

export async function summarizeReview(content: string) {
  const response = await api.post<{ summary: string; source: "gemini" | "fallback" }>("/ai/content/summarize", { content });
  return response.data;
}

export async function generateHashtags(content: string) {
  const response = await api.post<{ hashtags: string[]; source: "gemini" | "fallback" }>("/ai/content/hashtags", { content });
  return response.data;
}

export async function moderateContent(content: string) {
  const response = await api.post<{ safe: boolean; labels: string[]; warning?: string | null; source: "gemini" | "fallback" }>("/ai/content/moderate", { content });
  return response.data;
}
