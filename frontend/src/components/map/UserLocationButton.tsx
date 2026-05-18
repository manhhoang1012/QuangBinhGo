import { LocateFixed } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { type LatLng } from "@/lib/mapUtils";

export function UserLocationButton({ onLocated, onError }: { onLocated: (location: LatLng) => void; onError?: (message: string) => void }) {
  const [isLocating, setIsLocating] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) {
      onError?.("Trình duyệt không hỗ trợ định vị.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocated({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsLocating(false);
      },
      () => {
        onError?.("Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền định vị của trình duyệt.");
        setIsLocating(false);
      },
    );
  };

  return (
    <Button className="gap-2" disabled={isLocating} onClick={locate} type="button" variant="outline">
      <LocateFixed className="h-4 w-4" />
      {isLocating ? "Đang định vị..." : "Vị trí của tôi"}
    </Button>
  );
}
