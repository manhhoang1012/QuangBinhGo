import { ExternalLink, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type LatLng } from "@/lib/mapUtils";
import { getRouteSuggestions, type MapPlace, type RouteSuggestion } from "@/services/placeApi";
import { useState } from "react";

export function RouteSuggestionPanel({
  selectedPlaces,
  userLocation,
  onRemove,
}: {
  selectedPlaces: MapPlace[];
  userLocation: LatLng | null;
  onRemove: (id: number) => void;
}) {
  const [travelMode, setTravelMode] = useState<"driving" | "motorbike" | "walking">("driving");
  const [route, setRoute] = useState<RouteSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const suggest = async () => {
    if (!userLocation) {
      setError("Vui lòng bật vị trí hiện tại trước khi gợi ý tuyến đường.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setRoute(await getRouteSuggestions({
        start_lat: userLocation.lat,
        start_lng: userLocation.lng,
        place_ids: selectedPlaces.map((place) => place.id),
        travel_mode: travelMode,
      }));
    } catch {
      setError("Không thể tạo tuyến đường từ các địa điểm đã chọn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-md border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Tuyến đường của tôi</h2>
        <span className="text-sm text-muted-foreground">{selectedPlaces.length} điểm</span>
      </div>
      <div className="mt-3 space-y-2">
        {selectedPlaces.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chọn “Thêm tuyến” trong popup marker để lập tuyến đường.</p>
        ) : selectedPlaces.map((place) => (
          <div className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm" key={place.id}>
            <span>{place.name}</span>
            <button onClick={() => onRemove(place.id)} type="button"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <select className="mt-3 w-full rounded-md border bg-background px-3 py-2 text-sm" value={travelMode} onChange={(event) => setTravelMode(event.target.value as "driving" | "motorbike" | "walking")}>
        <option value="driving">Ô tô</option>
        <option value="motorbike">Xe máy</option>
        <option value="walking">Đi bộ</option>
      </select>
      <Button className="mt-3 w-full" disabled={loading || selectedPlaces.length === 0} onClick={() => void suggest()}>
        {loading ? "Đang gợi ý..." : "Gợi ý thứ tự đi"}
      </Button>
      {error && <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {route && (
        <div className="mt-4 space-y-3 text-sm">
          <p className="font-medium">{route.total_distance_km.toFixed(1)} km · {route.estimated_duration_text}</p>
          <ol className="space-y-1">
            {route.ordered_places.map((place, index) => <li key={place.id}>{index + 1}. {place.name}</li>)}
          </ol>
          <a href={route.google_maps_url} rel="noreferrer" target="_blank">
            <Button className="w-full gap-2" variant="outline">
              <ExternalLink className="h-4 w-4" />
              Mở trên Google Maps
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
