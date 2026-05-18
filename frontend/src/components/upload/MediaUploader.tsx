import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { uploadFiles, type UploadedMedia, type UploadType } from "@/services/uploadApi";

interface MediaUploaderProps {
  uploadType: UploadType;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  value?: string[];
  onChange: (urls: string[], media?: UploadedMedia[]) => void;
  allowVideo?: boolean;
  disabled?: boolean;
}

export function MediaUploader({
  uploadType,
  accept = "image/jpeg,image/png,image/webp",
  multiple = true,
  maxFiles = 10,
  maxSizeMB = 5,
  value = [],
  onChange,
  allowVideo = false,
  disabled = false,
}: MediaUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  const selectFiles = (selected: FileList | null) => {
    if (!selected) return;
    setError(null);
    const next = [...files];
    for (const file of Array.from(selected)) {
      if (next.length + value.length >= maxFiles) {
        setError(`Tối đa ${maxFiles} file.`);
        break;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File phải nhỏ hơn ${maxSizeMB}MB.`);
        continue;
      }
      if (!allowVideo && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Only JPG, PNG, WEBP images are allowed.");
        continue;
      }
      next.push(file);
    }
    setFiles(next);
  };

  const upload = async () => {
    if (!files.length) return;
    setIsUploading(true);
    setError(null);
    try {
      const result = await uploadFiles(files, uploadType);
      onChange([...value, ...result.urls], result.items);
      setFiles([]);
    } catch {
      setError("Upload thất bại. Vui lòng kiểm tra định dạng và dung lượng file.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="flex min-h-28 cursor-pointer items-center justify-center rounded-md border border-dashed bg-muted/40 text-sm text-muted-foreground hover:bg-muted">
        <ImagePlus className="mr-2 h-5 w-5" />
        Chọn file
        <input accept={accept} className="hidden" disabled={disabled} multiple={multiple} onChange={(event) => selectFiles(event.target.files)} type="file" />
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {(value.length > 0 || previews.length > 0) && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {value.map((url, index) => (
            <Preview key={url} url={url} onRemove={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} />
          ))}
          {previews.map((preview, index) => (
            <Preview key={`${preview.file.name}-${index}`} url={preview.url} isVideo={preview.file.type.startsWith("video/")} onRemove={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} />
          ))}
        </div>
      )}
      <Button className="gap-2" disabled={disabled || isUploading || files.length === 0} onClick={() => void upload()} type="button" variant="outline">
        <UploadCloud className="h-4 w-4" />
        {isUploading ? "Đang upload..." : "Upload"}
      </Button>
    </div>
  );
}

function Preview({ isVideo, onRemove, url }: { isVideo?: boolean; onRemove: () => void; url: string }) {
  return (
    <div className="relative overflow-hidden rounded-md border">
      {isVideo ? <video className="h-28 w-full bg-black object-cover" src={url} /> : <img alt="Preview" className="h-28 w-full object-cover" src={url} />}
      <button className="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow" onClick={onRemove} type="button">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
