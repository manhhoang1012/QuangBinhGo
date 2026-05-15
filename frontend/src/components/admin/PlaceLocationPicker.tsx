import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { LocateFixed, Search } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type NominatimPlace, reverseGeocode, searchLocations } from "@/services/nominatimApi";

const QUANG_BINH_CENTER = { lat: 17.4689, lng: 106.6223 };

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface LocationValue {
  latitude?: string | number;
  longitude?: string | number;
  address: string;
}

interface PlaceLocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}

export function PlaceLocationPicker({ onChange, value }: PlaceLocationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const selectedPosition = useMemo(() => {
    const lat = Number(value.latitude);
    const lng = Number(value.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }, [value.latitude, value.longitude]);

  useEffect(() => {
    const keyword = query.trim();
    if (keyword.length < 3) {
      setResults([]);
      setHasSearched(false);
      setSearchError(null);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      setHasSearched(true);
      try {
        setResults(await searchLocations(keyword));
      } catch {
        setResults([]);
        setSearchError("Không thể tìm địa điểm. Vui lòng thử lại.");
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const selectLocation = (lat: number, lng: number, address?: string) => {
    onChange({
      address: address || value.address,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    });
  };

  const selectSearchResult = (result: NominatimPlace) => {
    selectLocation(Number(result.lat), Number(result.lon), result.display_name);
    setQuery(result.display_name);
    setResults([]);
    setHasSearched(false);
  };

  const handleMapPick = async (lat: number, lng: number) => {
    selectLocation(lat, lng);
    setIsReverseGeocoding(true);
    try {
      const address = await reverseGeocode(lat, lng);
      onChange({ address: address || value.address, latitude: lat.toFixed(6), longitude: lng.toFixed(6) });
    } catch {
      setSearchError("Đã chọn vị trí nhưng không lấy được địa chỉ tự động.");
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError("Trình duyệt không hỗ trợ lấy vị trí hiện tại.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => void handleMapPick(position.coords.latitude, position.coords.longitude),
      () => setSearchError("Không thể truy cập vị trí hiện tại."),
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm địa điểm bằng OpenStreetMap"
          value={query}
        />
      </div>

      {(isSearching || searchError || results.length > 0 || (hasSearched && results.length === 0)) && (
        <div className="rounded-md border bg-background">
          {isSearching && <p className="p-3 text-sm text-muted-foreground">Đang tìm địa điểm...</p>}
          {searchError && <p className="p-3 text-sm text-destructive">{searchError}</p>}
          {!isSearching && !searchError && hasSearched && results.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">Không tìm thấy địa điểm phù hợp.</p>
          )}
          {!isSearching && results.map((result) => (
            <button
              className="block w-full border-t px-3 py-2 text-left text-sm hover:bg-muted first:border-t-0"
              key={result.place_id}
              onClick={() => selectSearchResult(result)}
              type="button"
            >
              {result.display_name}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-md border">
        <MapContainer
          center={selectedPosition ?? QUANG_BINH_CENTER}
          className="h-[360px] w-full"
          scrollWheelZoom
          zoom={selectedPosition ? 13 : 10}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onPick={(lat, lng) => void handleMapPick(lat, lng)} />
          <MapRecenter position={selectedPosition} />
          {selectedPosition && <Marker position={selectedPosition} />}
        </MapContainer>
      </div>

      {selectedPosition && <p className="text-sm text-muted-foreground">Vị trí đã được chọn trên bản đồ.</p>}
      {isReverseGeocoding && <p className="text-sm text-muted-foreground">Đang lấy địa chỉ từ tọa độ...</p>}
      <Button className="gap-2" onClick={useCurrentLocation} type="button" variant="outline">
        <LocateFixed className="h-4 w-4" />
        Dùng vị trí hiện tại
      </Button>
    </div>
  );
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [map, position]);

  return null;
}
