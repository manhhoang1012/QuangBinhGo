import { api, type Place, type ReviewPost } from "@/services/api";

export interface AnalyticsSummary {
  total_place_views: number;
  total_post_views: number;
  views_today: number;
  searches_today: number;
  top_places: Place[];
  top_posts: ReviewPost[];
  popular_keywords: Array<{ keyword: string; count: number }>;
  views_by_day: Array<{ date: string; count: number }>;
  searches_by_day: Array<{ date: string; count: number }>;
}

export interface SearchLogRead {
  id: number;
  query: string;
  search_type: string;
  filters?: Record<string, unknown> | null;
  result_count: number;
  created_at: string;
  user?: { id: number; username?: string | null; full_name: string } | null;
}

export interface ContentViewRead {
  id: number;
  content_type: "place" | "post";
  content_id: number;
  session_id?: string | null;
  user_agent?: string | null;
  referrer?: string | null;
  created_at: string;
  user?: { id: number; username?: string | null; full_name: string } | null;
}

export async function getTrendingPosts(limit = 6) {
  const response = await api.get<ReviewPost[]>("/analytics/trending/posts", { params: { limit } });
  return response.data;
}

export async function getTrendingPlaces(limit = 6) {
  const response = await api.get<Place[]>("/analytics/trending/places", { params: { limit } });
  return response.data;
}

export async function getAdminAnalyticsSummary() {
  const response = await api.get<AnalyticsSummary>("/admin/analytics/summary");
  return response.data;
}

export async function getAdminSearchLogs(params: Record<string, unknown> = {}) {
  const response = await api.get<SearchLogRead[]>("/admin/analytics/searches", { params });
  return response.data;
}

export async function getAdminContentViews(params: Record<string, unknown> = {}) {
  const response = await api.get<ContentViewRead[]>("/admin/analytics/content-views", { params });
  return response.data;
}
