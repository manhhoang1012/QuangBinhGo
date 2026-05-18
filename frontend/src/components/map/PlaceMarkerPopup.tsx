import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { buildGoogleMapsDirectionsUrl, parsePlaceLocation, type LatLng } from "@/lib/mapUtils";
import { type MapPlace } from "@/services/placeApi";

export function PlaceMarkerPopup({
  place,
  userLocation,
  onToggleRoute,
  selected,
}: {
  place: MapPlace;
  userLocation: LatLng | null;
  onToggleRoute?: (place: MapPlace) => void;
  selected?: boolean;
}) {
  const destination = parsePlaceLocation(place);
  const directionsUrl = destination ? buildGoogleMapsDirectionsUrl({ origin: userLocation, destination }) : "#";

  return (
    <div className="w-56 space-y-2">
      <img
        alt={place.name}
        className="h-24 w-full rounded-md object-cover"
        src={place.cover_image || "https://placehold.co/400x240?text=QuangBinhGo"}
      />
      <div>
        <p className="font-semibold">{place.name}</p>
        <p className="text-xs text-muted-foreground">{place.address}</p>
      </div>
      <p className="text-xs text-muted-foreground">
        {Number(place.rating_avg || 0).toFixed(1)} sao
        {typeof place.distance_km === "number" ? ` · ${place.distance_km.toFixed(1)} km` : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link to={`/places/${place.slug || place.id}`}>
          <Button className="h-8 px-2 text-xs" variant="outline">Chi tiết</Button>
        </Link>
        <a href={directionsUrl} rel="noreferrer" target="_blank">
          <Button className="h-8 gap-1 px-2 text-xs">
            <ExternalLink className="h-3.5 w-3.5" />
            Chỉ đường
          </Button>
        </a>
        {onToggleRoute && (
          <Button className="h-8 px-2 text-xs" variant={selected ? "secondary" : "outline"} onClick={() => onToggleRoute(place)}>
            {selected ? "Bỏ tuyến" : "Thêm tuyến"}
          </Button>
        )}
      </div>
    </div>
  );
}
