import { api, type Place } from "@/services/api";

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
