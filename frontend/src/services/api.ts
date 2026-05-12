import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Place {
  id: number;
  name: string;
  description: string;
  category: string;
  address: string;
  latitude: string | number;
  longitude: string | number;
  images: string[];
  rating_avg: string | number;
}

interface GetPlacesParams {
  category?: string;
  search?: string;
}

export async function getPlaces(params: GetPlacesParams = {}) {
  const response = await api.get<Place[]>("/places", { params });
  return response.data;
}
