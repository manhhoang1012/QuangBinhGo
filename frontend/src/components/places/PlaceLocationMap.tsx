import { useMemo, useState } from "react";
import L from "leaflet";
import { ExternalLink, MapPin } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { UserLocationButton } from "@/components/map/UserLocationButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildGoogleMapsDirectionsUrl, haversineKm, type LatLng } from "@/lib/mapUtils";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface PlaceLocationMapProps {
  address: string;
  latitude: string | number;
  longitude: string | number;
  placeName: string;
}

export function PlaceLocationMap({ address, latitude, longitude, placeName }: PlaceLocationMapProps) {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const placeLocation = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }, [latitude, longitude]);

  const directionsUrl = useMemo(() => {
    if (!placeLocation) return "#";
    return buildGoogleMapsDirectionsUrl({ origin: userLocation, destination: placeLocation });
  }, [placeLocation, userLocation]);

  const distanceKm = placeLocation && userLocation ? haversineKm(userLocation, placeLocation) : null;

  if (!placeLocation) {
    return (
      <Card className="mt-10">
        <CardHeader>
          <CardTitle>Vị trí địa điểm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-64 items-center justify-center rounded-lg border bg-muted/40 text-center text-sm text-muted-foreground">
            Địa điểm này chưa có vị trí bản đồ.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-10 overflow-hidden">
      <CardHeader>
        <CardTitle>Vị trí địa điểm</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          {address}
          {distanceKm !== null ? <span className="font-medium text-foreground">· {distanceKm.toFixed(1)} km từ bạn</span> : null}
        </p>

        <div className="overflow-hidden rounded-lg border">
          <MapContainer center={placeLocation} className="h-[300px] w-full md:h-[420px]" scrollWheelZoom zoom={15}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={placeLocation}>
              <Popup>
                <div className="space-y-1">
                  <p className="font-medium">{placeName}</p>
                  <p className="text-sm">{address}</p>
                </div>
              </Popup>
            </Marker>
            {userLocation && (
              <Marker position={userLocation}>
                <Popup>Vị trí của bạn</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {locationError && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{locationError}</p>}

        <div className="flex flex-wrap gap-2">
          <UserLocationButton onLocated={(location) => { setUserLocation(location); setLocationError(null); }} onError={setLocationError} />
          <a href={directionsUrl} rel="noreferrer" target="_blank">
            <Button className="gap-2" type="button">
              <ExternalLink className="h-4 w-4" />
              Chỉ đường
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
