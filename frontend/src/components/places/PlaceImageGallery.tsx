import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { optimizeImageUrl } from "@/utils/image";

interface PlaceImageGalleryProps {
  images: string[];
  placeName: string;
}

export function PlaceImageGallery({ images, placeName }: PlaceImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasImages = images.length > 0;

  useEffect(() => {
    setSelectedIndex(0);
  }, [images]);

  const showPrevious = () => {
    if (!hasImages) return;
    setSelectedIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  };

  const showNext = () => {
    if (!hasImages) return;
    setSelectedIndex((current) => (current === images.length - 1 ? 0 : current + 1));
  };

  if (!hasImages) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-lg border bg-muted/40 text-center text-muted-foreground">
        <div>
          <ImageIcon className="mx-auto h-10 w-10" />
          <p className="mt-3 text-sm">Chưa có hình ảnh cho địa điểm này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg border bg-muted">
        <img
          alt={`${placeName} - ảnh ${selectedIndex + 1}`}
          className="aspect-[16/9] w-full object-cover"
          height={675}
          src={optimizeImageUrl(images[selectedIndex], { width: 1200, crop: "limit" })}
          width={1200}
        />
        {images.length > 1 && (
          <>
            <Button
              aria-label="Ảnh trước"
              className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-background/90 p-0 shadow hover:bg-background"
              onClick={showPrevious}
              type="button"
              variant="outline"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              aria-label="Ảnh tiếp theo"
              className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-background/90 p-0 shadow hover:bg-background"
              onClick={showNext}
              type="button"
              variant="outline"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              aria-label={`Chọn ảnh ${index + 1}`}
              className={`h-20 w-28 shrink-0 overflow-hidden rounded-md border-2 bg-muted transition ${
                selectedIndex === index ? "border-destructive shadow-sm" : "border-transparent hover:border-muted-foreground/40"
              }`}
              key={`${image}-${index}`}
              onClick={() => setSelectedIndex(index)}
              type="button"
            >
              <img
                alt={`${placeName} thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
                height={80}
                loading="lazy"
                src={optimizeImageUrl(image, { width: 240, height: 180, crop: "fill" })}
                width={112}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
