import { useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { LocateFixed, Save, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Place } from "@/services/api";
import { uploadPlaceImages } from "@/services/adminApi";
import { type PlacePayload } from "@/services/placeApi";

const QUANG_BINH_CENTER = { lat: 17.4689, lng: 106.6223 };
const libraries: "places"[] = ["places"];
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxFileSize = 5 * 1024 * 1024;

interface PreviewImage {
  file: File;
  url: string;
}

export const emptyPlaceForm: PlacePayload = {
  name: "",
  description: "",
  category: "nature",
  address: "",
  latitude: "",
  longitude: "",
  images: [],
  rating_avg: 4.5,
  status: "active",
};

interface PlaceFormProps {
  initialPlace?: Place | null;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (payload: PlacePayload) => Promise<void>;
}

export function PlaceForm({ initialPlace, isSaving, onCancel, onSubmit }: PlaceFormProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const [form, setForm] = useState<PlacePayload>(placeToForm(initialPlace));
  const [keptImages, setKeptImages] = useState<string[]>(initialPlace?.images ?? []);
  const [newImages, setNewImages] = useState<PreviewImage[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const newImagesRef = useRef<PreviewImage[]>([]);

  const selectedPosition = useMemo(() => {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : QUANG_BINH_CENTER;
  }, [form.latitude, form.longitude]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? "",
    libraries,
    id: "quangbinhgo-admin-places-map",
  });

  useEffect(() => {
    newImagesRef.current = newImages;
  }, [newImages]);

  useEffect(() => {
    return () => newImagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
  }, []);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    const location = place?.geometry?.location;
    if (!location) return;

    setForm((current) => ({
      ...current,
      name: current.name || place.name || "",
      address: place.formatted_address || current.address,
      latitude: location.lat().toFixed(6),
      longitude: location.lng().toFixed(6),
    }));
  };

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setCoordinates(lat, lng);
    reverseGeocode(lat, lng);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFormError("Browser geolocation is not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates(latitude, longitude);
        reverseGeocode(latitude, longitude);
      },
      () => setFormError("Could not access current location."),
    );
  };

  const reverseGeocode = (lat: number, lng: number) => {
    if (!window.google?.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        setForm((current) => ({ ...current, address: results[0].formatted_address }));
      }
    });
  };

  const setCoordinates = (lat: number, lng: number) => {
    setForm((current) => ({ ...current, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const nextFiles = Array.from(files);
    const invalid = nextFiles.find((file) => !allowedTypes.includes(file.type) || file.size > maxFileSize);
    if (invalid) {
      setFileError("Images must be jpg, png, or webp and 5MB or smaller.");
      return;
    }
    setFileError(null);
    setNewImages((current) => [
      ...current,
      ...nextFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  };

  const submit = async () => {
    setFormError(null);
    if (!form.name.trim() || !form.description.trim() || !form.category.trim() || !form.address.trim() || !form.latitude || !form.longitude) {
      setFormError("Name, description, category, address, latitude, and longitude are required.");
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrls = newImages.length ? await uploadPlaceImages(newImages.map((image) => image.file)) : [];
      await onSubmit({ ...form, images: [...keptImages, ...uploadedUrls] });
    } catch {
      setFormError("Could not upload images or save place.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardContent className="space-y-5 pt-5">
        {formError && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{formError}</div>}
        <div className="grid gap-4 md:grid-cols-2">
          <Input onChange={(event) => setFormValue("name", event.target.value)} placeholder="Name" value={String(form.name)} />
          <Input onChange={(event) => setFormValue("category", event.target.value)} placeholder="Category" value={String(form.category)} />
          <select className="rounded-md border bg-background px-3 py-2 text-sm" onChange={(event) => setFormValue("status", event.target.value)} value={String(form.status ?? "active")}>
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
          </select>
          <Input onChange={(event) => setFormValue("rating_avg", Number(event.target.value))} placeholder="Rating" type="number" value={String(form.rating_avg)} />
          <Textarea className="md:col-span-2" onChange={(event) => setFormValue("description", event.target.value)} placeholder="Description" value={String(form.description)} />
        </div>

        {apiKey && isLoaded ? (
          <div className="space-y-3">
            <Autocomplete onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }} onPlaceChanged={handlePlaceChanged}>
              <Input placeholder="Search with Google Places" />
            </Autocomplete>
            <GoogleMap center={selectedPosition} mapContainerClassName="h-[360px] w-full rounded-md border" onClick={handleMapClick} zoom={initialPlace ? 13 : 10}>
              <Marker position={selectedPosition} />
            </GoogleMap>
          </div>
        ) : (
          <div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
            Google Maps is unavailable. Add VITE_GOOGLE_MAPS_API_KEY to frontend/.env to enable map selection.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-[1fr_160px_160px]">
          <Input onChange={(event) => setFormValue("address", event.target.value)} placeholder="Address" value={String(form.address)} />
          <Input onChange={(event) => setFormValue("latitude", event.target.value)} placeholder="Latitude" value={String(form.latitude)} />
          <Input onChange={(event) => setFormValue("longitude", event.target.value)} placeholder="Longitude" value={String(form.longitude)} />
        </div>
        <Button className="gap-2" onClick={useCurrentLocation} type="button" variant="outline"><LocateFixed className="h-4 w-4" />Use current location</Button>

        <div>
          <p className="font-medium">Images</p>
          <p className="mt-1 text-sm text-muted-foreground">Upload jpg, png, or webp images. Max 5MB per file.</p>
          {fileError && <p className="mt-2 text-sm text-destructive">{fileError}</p>}
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {keptImages.map((image) => (
              <ImagePreview key={image} src={image} onRemove={() => setKeptImages((current) => current.filter((item) => item !== image))} />
            ))}
            {newImages.map((image, index) => (
              <ImagePreview key={`${image.file.name}-${index}`} src={image.url} onRemove={() => {
                URL.revokeObjectURL(image.url);
                setNewImages((current) => current.filter((_, fileIndex) => fileIndex !== index));
              }} />
            ))}
          </div>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Upload className="h-4 w-4" />
            Upload images
            <input accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="hidden" multiple onChange={(event) => handleFiles(event.target.files)} type="file" />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button className="gap-2" disabled={isSaving || isUploading} onClick={() => void submit()}><Save className="h-4 w-4" />{isSaving || isUploading ? "Saving..." : "Save"}</Button>
          <Button className="gap-2" onClick={onCancel} variant="outline"><X className="h-4 w-4" />Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );

  function setFormValue(key: keyof PlacePayload, value: PlacePayload[keyof PlacePayload]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
}

function ImagePreview({ onRemove, src }: { onRemove: () => void; src: string }) {
  return (
    <div className="relative overflow-hidden rounded-md border">
      <img alt="Place preview" className="h-36 w-full object-cover" src={src} />
      <button className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white" onClick={onRemove} type="button">Remove</button>
    </div>
  );
}

function placeToForm(place?: Place | null): PlacePayload {
  if (!place) return emptyPlaceForm;
  return {
    name: place.name,
    description: place.description,
    category: place.category,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    images: place.images,
    rating_avg: place.rating_avg,
    status: place.status ?? "active",
  };
}
