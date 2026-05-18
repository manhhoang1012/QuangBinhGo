export interface LatLng {
  lat: number;
  lng: number;
}

export function haversineKm(origin: LatLng, destination: LatLng) {
  const radius = 6371;
  const dLat = toRad(destination.lat - origin.lat);
  const dLng = toRad(destination.lng - origin.lng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(origin.lat)) * Math.cos(toRad(destination.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(a));
}

export function buildGoogleMapsDirectionsUrl({
  origin,
  destination,
  waypoints = [],
}: {
  origin?: LatLng | null;
  destination: LatLng;
  waypoints?: LatLng[];
}) {
  const params = new URLSearchParams({ api: "1", destination: `${destination.lat},${destination.lng}` });
  if (origin) params.set("origin", `${origin.lat},${origin.lng}`);
  if (waypoints.length) params.set("waypoints", waypoints.map((point) => `${point.lat},${point.lng}`).join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function parsePlaceLocation(place: { latitude: string | number; longitude: string | number }) {
  const lat = Number(place.latitude);
  const lng = Number(place.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function toRad(value: number) {
  return value * Math.PI / 180;
}
