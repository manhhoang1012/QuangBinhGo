import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { PlaceMarkerPopup } from "@/components/map/PlaceMarkerPopup";
import { parsePlaceLocation, type LatLng } from "@/lib/mapUtils";
import { type MapPlace } from "@/services/placeApi";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const defaultCenter = { lat: 17.4689, lng: 106.6223 };

export function PlacesMap({
  places,
  userLocation,
  selectedRouteIds,
  onToggleRoutePlace,
}: {
  places: MapPlace[];
  userLocation: LatLng | null;
  selectedRouteIds?: number[];
  onToggleRoutePlace?: (place: MapPlace) => void;
}) {
  return (
    <MapContainer center={userLocation ?? defaultCenter} className="h-full min-h-[520px] w-full" scrollWheelZoom zoom={10}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {places.map((place) => {
        const location = parsePlaceLocation(place);
        if (!location) return null;
        return (
          <Marker key={place.id} position={location}>
            <Popup>
              <PlaceMarkerPopup
                place={place}
                selected={selectedRouteIds?.includes(place.id)}
                userLocation={userLocation}
                onToggleRoute={onToggleRoutePlace}
              />
            </Popup>
          </Marker>
        );
      })}
      {userLocation && (
        <Marker position={userLocation}>
          <Popup>Vị trí của bạn</Popup>
        </Marker>
      )}
      <FitBounds places={places} userLocation={userLocation} />
    </MapContainer>
  );
}

function FitBounds({ places, userLocation }: { places: MapPlace[]; userLocation: LatLng | null }) {
  const map = useMap();

  useEffect(() => {
    const points = places
      .map(parsePlaceLocation)
      .filter((point): point is LatLng => Boolean(point));
    if (userLocation) points.push(userLocation);
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }
    map.fitBounds(points.map((point) => [point.lat, point.lng]), { padding: [40, 40] });
  }, [map, places, userLocation]);

  return null;
}
