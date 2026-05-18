import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PlacesMap } from "@/components/map/PlacesMap";
import { RouteSuggestionPanel } from "@/components/map/RouteSuggestionPanel";
import { UserLocationButton } from "@/components/map/UserLocationButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type LatLng } from "@/lib/mapUtils";
import { getMapPlaces, type MapPlace } from "@/services/placeApi";

const regions = ["Đồng Hới", "Bố Trạch", "Quảng Ninh", "Lệ Thủy", "Quảng Trạch", "Minh Hóa", "Tuyên Hóa", "Ba Đồn"];
const radiusOptions = [5, 10, 20, 50];

export function MapPage() {
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [region, setRegion] = useState("");
  const [radiusKm, setRadiusKm] = useState(10);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [selectedRoutePlaces, setSelectedRoutePlaces] = useState<MapPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const categories = useMemo(() => Array.from(new Set(places.map((place) => place.category).filter(Boolean))).sort(), [places]);
  const visiblePlaces = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return places;
    return places.filter((place) => `${place.name} ${place.address} ${place.category} ${place.region ?? ""}`.toLowerCase().includes(keyword));
  }, [places, search]);

  const loadPlaces = useCallback(async (nextLocation = userLocation) => {
    setLoading(true);
    setError(null);
    try {
      setPlaces(await getMapPlaces({
        category: category || undefined,
        tags: tags || undefined,
        region: region || undefined,
        near_lat: nextLocation?.lat,
        near_lng: nextLocation?.lng,
        radius_km: nextLocation ? radiusKm : undefined,
      }));
    } catch {
      setError("Không thể tải bản đồ địa điểm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [category, tags, region, radiusKm, userLocation]);

  useEffect(() => {
    void loadPlaces();
  }, [loadPlaces]);

  const handleLocated = (location: LatLng) => {
    setUserLocation(location);
    setNotice("Đã cập nhật vị trí hiện tại.");
    void loadPlaces(location);
  };

  const toggleRoutePlace = (place: MapPlace) => {
    setSelectedRoutePlaces((current) => current.some((item) => item.id === place.id)
      ? current.filter((item) => item.id !== place.id)
      : [...current, place]);
  };

  return (
    <section className="min-h-[calc(100vh-64px)] bg-muted/20">
      <div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4 border-r bg-background p-4">
          <div>
            <h1 className="text-2xl font-semibold">Bản đồ du lịch</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tìm địa điểm, xem gần bạn và lập tuyến đi trong Quảng Bình.</p>
          </div>

          <div className="space-y-3 rounded-md border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Tìm trên danh sách" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">Tất cả danh mục</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <Input placeholder="Tags, ví dụ: Check-in, Gia đình" value={tags} onChange={(event) => setTags(event.target.value)} />
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={region} onChange={(event) => setRegion(event.target.value)}>
              <option value="">Tất cả khu vực</option>
              {regions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <div className="flex flex-wrap gap-2">
              {radiusOptions.map((value) => (
                <Button className="h-8 px-3 text-xs" key={value} variant={radiusKm === value ? "secondary" : "outline"} onClick={() => setRadiusKm(value)}>
                  {value} km
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <UserLocationButton onLocated={handleLocated} onError={setNotice} />
              <Button variant="outline" onClick={() => void loadPlaces()}>Áp dụng lọc</Button>
            </div>
            {notice && <p className="rounded-md border bg-muted/40 p-3 text-sm">{notice}</p>}
            {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          </div>

          <RouteSuggestionPanel
            selectedPlaces={selectedRoutePlaces}
            userLocation={userLocation}
            onRemove={(id) => setSelectedRoutePlaces((current) => current.filter((place) => place.id !== id))}
          />

          <div className="max-h-80 space-y-2 overflow-auto rounded-md border p-3">
            <p className="text-sm font-medium">{loading ? "Đang tải..." : `${visiblePlaces.length} địa điểm`}</p>
            {!loading && visiblePlaces.length === 0 && <p className="text-sm text-muted-foreground">Không có địa điểm phù hợp.</p>}
            {visiblePlaces.map((place) => (
              <button
                className="w-full rounded-md p-2 text-left text-sm hover:bg-muted"
                key={place.id}
                onClick={() => toggleRoutePlace(place)}
                type="button"
              >
                <span className="font-medium">{place.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {place.region || place.category}{typeof place.distance_km === "number" ? ` · ${place.distance_km.toFixed(1)} km` : ""}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="min-h-[520px]">
          <PlacesMap
            places={visiblePlaces}
            selectedRouteIds={selectedRoutePlaces.map((place) => place.id)}
            userLocation={userLocation}
            onToggleRoutePlace={toggleRoutePlace}
          />
        </div>
      </div>
    </section>
  );
}
