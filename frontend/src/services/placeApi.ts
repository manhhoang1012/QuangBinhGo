import axios from "axios";
import { api, authStorage, type Place, type PlaceReview } from "@/services/api";

export interface GetPlacesParams {
  q?: string;
  category?: string;
  tags?: string;
  min_rating?: number;
  max_price?: number;
  price_type?: string;
  near_lat?: number;
  near_lng?: number;
  radius_km?: number;
  sort?: string;
  page?: number;
  search?: string;
  skip?: number;
  limit?: number;
}

export type PlacePayload = Omit<Place, "id" | "cover_image" | "distance_km" | "related_places">;

export async function getPlaces(params: GetPlacesParams = {}) {
  const response = await api.get<Place[]>("/places", { params });
  return response.data;
}

export async function getPlace(placeId: number | string) {
  const response = await api.get<Place>(`/places/${placeId}`);
  return response.data;
}

export const getPlaceDetail = getPlace;

export async function semanticSearchPlaces(query: string) {
  const response = await api.get<Place[]>("/places/semantic-search", { params: { q: query } });
  return response.data;
}

export async function getNearbyPlaces(lat: number, lng: number, radiusKm = 50) {
  return getPlaces({ near_lat: lat, near_lng: lng, radius_km: radiusKm, sort: "distance_asc" });
}

export interface PlaceReviewList {
  items: PlaceReview[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  rating_summary: {
    average_rating: number;
    review_count: number;
    star_counts: Record<number, number>;
  };
}

export async function getPlaceReviews(placeId: number, params: { rating?: number; sort?: string; page?: number; limit?: number } = {}) {
  const response = await api.get<PlaceReviewList>(`/places/${placeId}/reviews`, { params });
  return response.data;
}

export async function createPlaceReview(placeId: number, payload: { rating: number; content: string; images?: string[] }) {
  const response = await api.post<PlaceReview>(`/places/${placeId}/reviews`, payload);
  return response.data;
}

export async function updatePlaceReview(placeId: number, reviewId: number, payload: { rating?: number; content?: string; images?: string[] }) {
  const response = await api.patch<PlaceReview>(`/places/${placeId}/reviews/${reviewId}`, payload);
  return response.data;
}

export async function deletePlaceReview(placeId: number, reviewId: number) {
  await api.delete(`/places/${placeId}/reviews/${reviewId}`);
}

export async function uploadPlaceReviewImages(placeId: number, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const token = authStorage.getToken();
  const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
  const response = await axios.post<{ urls: string[] }>(`${baseURL}/places/${placeId}/reviews/uploads`, formData, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data.urls;
}

export async function getFeaturedPlaceReviews(placeId: number) {
  const response = await api.get<PlaceReview[]>(`/places/${placeId}/reviews/featured`);
  return response.data;
}

export async function markReviewHelpful(placeId: number, reviewId: number) {
  const response = await api.post(`/places/${placeId}/reviews/${reviewId}/helpful`);
  return response.data;
}

export async function unmarkReviewHelpful(placeId: number, reviewId: number) {
  const response = await api.delete(`/places/${placeId}/reviews/${reviewId}/helpful`);
  return response.data;
}

export async function reportPlaceReview(placeId: number, reviewId: number, data: { reason: "false_info" | "spam" | "offensive" | "other"; detail?: string }) {
  const response = await api.post(`/places/${placeId}/reviews/${reviewId}/reports`, data);
  return response.data;
}

export async function createPlace(payload: PlacePayload) {
  const response = await api.post<Place>("/places", payload);
  return response.data;
}

export async function updatePlace(placeId: number, payload: Partial<PlacePayload>) {
  const response = await api.patch<Place>(`/places/${placeId}`, payload);
  return response.data;
}

export async function deletePlace(placeId: number) {
  await api.delete(`/places/${placeId}`);
}
