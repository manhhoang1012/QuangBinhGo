import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { ExternalLink, LocateFixed, MapPin } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

interface UserLocation {
  lat: number;
  lng: number;
}

export function PlaceLocationMap({ address, latitude, longitude, placeName }: PlaceLocationMapProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const placeLocation = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }, [latitude, longitude]);

  const directionsUrl = useMemo(() => {
    if (!placeLocation) return "#";
    const destination = `${placeLocation.lat},${placeLocation.lng}`;
    if (userLocation) {
      return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  }, [placeLocation, userLocation]);

  const locateUser = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ định vị.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setLocationError("Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền định vị của trình duyệt.");
        setIsLocating(false);
      },
    );
  };

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
            <FitMapBounds placeLocation={placeLocation} userLocation={userLocation} />
          </MapContainer>
        </div>

        {locationError && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{locationError}</p>}

        <div className="flex flex-wrap gap-2">
          <Button className="gap-2" disabled={isLocating} onClick={locateUser} type="button" variant="outline">
            <LocateFixed className="h-4 w-4" />
            {isLocating ? "Đang định vị..." : "Định vị của tôi"}
          </Button>
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

function FitMapBounds({
  placeLocation,
  userLocation,
}: {
  placeLocation: UserLocation;
  userLocation: UserLocation | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.fitBounds(
        [
          [placeLocation.lat, placeLocation.lng],
          [userLocation.lat, userLocation.lng],
        ],
        { padding: [40, 40] },
      );
    } else {
      map.setView(placeLocation, 15);
    }
  }, [map, placeLocation, userLocation]);

  return null;
}
