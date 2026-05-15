import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon, Save, Upload, X } from "lucide-react";

import { PlaceLocationPicker } from "@/components/admin/PlaceLocationPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Place } from "@/services/api";
import { uploadPlaceImages } from "@/services/adminApi";
import { type PlacePayload } from "@/services/placeApi";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxFileSize = 5 * 1024 * 1024;
const maxImagesPerPlace = 10;

interface PreviewImage {
  file: File;
  url: string;
}

interface AdminGalleryImage {
  kind: "kept" | "new";
  url: string;
}

const emptyPlaceForm: PlacePayload = {
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
  const [form, setForm] = useState<PlacePayload>(placeToForm(initialPlace));
  const [keptImages, setKeptImages] = useState<string[]>(initialPlace?.images ?? []);
  const [newImages, setNewImages] = useState<PreviewImage[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const newImagesRef = useRef<PreviewImage[]>([]);
  const hasSelectedLocation = Boolean(form.latitude && form.longitude);

  const galleryImages = useMemo(
    () => [
      ...keptImages.map((url) => ({ kind: "kept" as const, url })),
      ...newImages.map((image) => ({ kind: "new" as const, url: image.url })),
    ],
    [keptImages, newImages],
  );
  const selectedImage = galleryImages[selectedImageIndex] ?? galleryImages[0];

  useEffect(() => {
    newImagesRef.current = newImages;
  }, [newImages]);

  useEffect(() => {
    return () => newImagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
  }, []);

  useEffect(() => {
    if (selectedImageIndex >= galleryImages.length) {
      setSelectedImageIndex(Math.max(galleryImages.length - 1, 0));
    }
  }, [galleryImages.length, selectedImageIndex]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const nextFiles = Array.from(files);
    const invalid = nextFiles.find((file) => !allowedTypes.includes(file.type) || file.size > maxFileSize);
    if (invalid) {
      setFileError("Images must be jpg, png, or webp and 5MB or smaller.");
      return;
    }
    if (keptImages.length + newImages.length + nextFiles.length > maxImagesPerPlace) {
      setFileError(`Each place can have up to ${maxImagesPerPlace} images.`);
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
    if (!form.name.trim() || !form.description.trim() || !form.category.trim() || !form.address.trim()) {
      setFormError("Name, description, category, and address are required.");
      return;
    }
    if (!hasSelectedLocation) {
      setFormError("Vui lòng chọn vị trí trên bản đồ.");
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

        <PlaceLocationPicker
          onChange={(location) => {
            setForm((current) => ({
              ...current,
              address: location.address,
              latitude: location.latitude ?? current.latitude,
              longitude: location.longitude ?? current.longitude,
            }));
          }}
          value={{
            address: String(form.address),
            latitude: form.latitude,
            longitude: form.longitude,
          }}
        />

        <div className="grid gap-4">
          <Input onChange={(event) => setFormValue("address", event.target.value)} placeholder="Address" value={String(form.address)} />
        </div>

        <div>
          <p className="font-medium">Images</p>
          <p className="mt-1 text-sm text-muted-foreground">Upload jpg, jpeg, png, or webp images. Max 5MB per file and {maxImagesPerPlace} images per place.</p>
          {fileError && <p className="mt-2 text-sm text-destructive">{fileError}</p>}
          <AdminImageGallery
            images={galleryImages}
            onRemove={(image, index) => {
              if (image.kind === "kept") {
                setKeptImages((current) => current.filter((item) => item !== image.url));
              } else {
                const newImageIndex = index - keptImages.length;
                const target = newImages[newImageIndex];
                if (target) URL.revokeObjectURL(target.url);
                setNewImages((current) => current.filter((_, fileIndex) => fileIndex !== newImageIndex));
              }
            }}
            onSelect={setSelectedImageIndex}
            selectedIndex={selectedImageIndex}
            selectedImage={selectedImage}
          />
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

function AdminImageGallery({
  images,
  onRemove,
  onSelect,
  selectedImage,
  selectedIndex,
}: {
  images: AdminGalleryImage[];
  onRemove: (image: AdminGalleryImage, index: number) => void;
  onSelect: (index: number) => void;
  selectedImage?: AdminGalleryImage;
  selectedIndex: number;
}) {
  const showPrevious = () => onSelect(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1);
  const showNext = () => onSelect(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1);

  if (!selectedImage) {
    return (
      <div className="mt-3 flex min-h-48 items-center justify-center rounded-md border bg-muted/40 text-center text-sm text-muted-foreground">
        <div>
          <ImageIcon className="mx-auto h-8 w-8" />
          <p className="mt-2">Chưa có hình ảnh cho địa điểm này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="relative overflow-hidden rounded-md border bg-muted">
        <img alt="Place preview" className="aspect-[16/9] w-full object-cover" src={selectedImage.url} />
        {images.length > 1 && (
          <>
            <button className="absolute left-3 top-1/2 rounded-full bg-background/90 p-2 shadow" onClick={showPrevious} type="button">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="absolute right-3 top-1/2 rounded-full bg-background/90 p-2 shadow" onClick={showNext} type="button">
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
        <button className="absolute right-3 top-3 rounded-md bg-black/65 px-3 py-1.5 text-xs font-medium text-white" onClick={() => onRemove(selectedImage, selectedIndex)} type="button">
          Remove
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((image, index) => (
          <button
            className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-md border-2 bg-muted ${
              selectedIndex === index ? "border-destructive shadow-sm" : "border-transparent hover:border-muted-foreground/40"
            }`}
            key={`${image.url}-${index}`}
            onClick={() => onSelect(index)}
            type="button"
          >
            <img alt={`Place thumbnail ${index + 1}`} className="h-full w-full object-cover" src={image.url} />
          </button>
        ))}
      </div>
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
