const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

export interface NominatimPlace {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export async function searchLocations(query: string): Promise<NominatimPlace[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    limit: "5",
    countrycodes: "vn",
  });
  const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Could not search location.");
  }
  return response.json();
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "json",
    addressdetails: "1",
  });
  const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Could not reverse geocode location.");
  }
  const data = await response.json();
  return data.display_name ?? "";
}
