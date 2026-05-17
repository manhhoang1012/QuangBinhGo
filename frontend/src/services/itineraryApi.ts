import { api, type Place } from "@/services/api";

export interface ItineraryItem {
  id: number;
  place_id?: number | null;
  place?: Place | null;
  day_number: number;
  start_time?: string | null;
  end_time?: string | null;
  title: string;
  note?: string | null;
  estimated_cost?: number | null;
  transport_note?: string | null;
  order_index: number;
}

export interface Itinerary {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  total_days: number;
  budget?: number | null;
  travel_style?: string | null;
  interests: string[];
  visibility: "private" | "public" | "shared";
  share_slug?: string | null;
  created_by_ai: boolean;
  items: ItineraryItem[];
  created_at: string;
  updated_at: string;
}

export interface AiItinerary {
  title: string;
  description: string;
  total_days: number;
  estimated_budget?: number | null;
  travel_style: string;
  interests: string[];
  days: Array<{ day_number: number; summary: string; items: Array<{ time: string; title: string; place_id?: number | null; place_name?: string | null; note: string; estimated_cost?: number | null; transport_note?: string | null; duration_minutes: number }> }>;
}

export const getItineraries = async () => (await api.get<Itinerary[]>("/itineraries")).data;
export const createItinerary = async (data: Partial<Itinerary> & { items?: Partial<ItineraryItem>[] }) => (await api.post<Itinerary>("/itineraries", data)).data;
export const getItinerary = async (id: number) => (await api.get<Itinerary>(`/itineraries/${id}`)).data;
export const updateItinerary = async (id: number, data: Partial<Itinerary>) => (await api.patch<Itinerary>(`/itineraries/${id}`, data)).data;
export const deleteItinerary = async (id: number) => api.delete(`/itineraries/${id}`);
export const addItineraryItem = async (id: number, data: Partial<ItineraryItem>) => (await api.post<ItineraryItem>(`/itineraries/${id}/items`, data)).data;
export const updateItineraryItem = async (id: number, itemId: number, data: Partial<ItineraryItem>) => (await api.patch<ItineraryItem>(`/itineraries/${id}/items/${itemId}`, data)).data;
export const deleteItineraryItem = async (id: number, itemId: number) => api.delete(`/itineraries/${id}/items/${itemId}`);
export const reorderItineraryItems = async (id: number, items: Array<{ item_id: number; day_number: number; order_index: number; start_time?: string | null }>) => (await api.patch<Itinerary>(`/itineraries/${id}/items/reorder`, items)).data;
export const shareItinerary = async (id: number) => (await api.post<Itinerary>(`/itineraries/${id}/share`)).data;
export const getSharedItinerary = async (shareSlug: string) => (await api.get<Itinerary>(`/itineraries/shared/${shareSlug}`)).data;
export const generateAiItinerary = async (data: { days: number; budget?: number | null; interests: string[]; travel_style: string; start_location?: string; start_date?: string; people_count?: number }) => (await api.post<AiItinerary>("/itineraries/ai/generate", data)).data;

export async function saveAiItinerary(data: AiItinerary) {
  return createItinerary({
    title: data.title,
    description: data.description,
    total_days: data.total_days,
    budget: data.estimated_budget ?? undefined,
    travel_style: data.travel_style,
    interests: data.interests,
    visibility: "private",
    created_by_ai: true,
    items: data.days.flatMap((day) => day.items.map((item, index) => ({
      day_number: day.day_number,
      start_time: item.time,
      title: item.title,
      place_id: item.place_id,
      note: item.note,
      estimated_cost: item.estimated_cost,
      transport_note: item.transport_note,
      order_index: index,
    }))),
  });
}
