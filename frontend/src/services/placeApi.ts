import { api, type Place } from "@/services/api";

export interface GetPlacesParams {
  category?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

export type PlacePayload = Omit<Place, "id">;

export async function getPlaces(params: GetPlacesParams = {}) {
  const response = await api.get<Place[]>("/places", { params });
  return response.data;
}

export async function getPlace(placeId: number) {
  const response = await api.get<Place>(`/places/${placeId}`);
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
