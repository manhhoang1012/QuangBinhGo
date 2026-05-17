import { useEffect, useMemo, useState } from "react";
import { FileVideo, ImagePlus, Save, Send, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Place } from "@/services/api";
import { getPlaces } from "@/services/placeApi";
import { createReviewPost, uploadPostImages, uploadPostVideos } from "@/services/postApi";

const maxImages = 10;
const maxVideos = 3;
const maxImageSize = 5 * 1024 * 1024;
const maxVideoSize = 50 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];

export function CreatePostPage() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState<Place[]>([]);
  const [title, setTitle] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [taggedUsers, setTaggedUsers] = useState("");
  const [visibility, setVisibility] = useState<"public" | "followers" | "private">("public");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getPlaces({ limit: 100 }).then(setPlaces).catch(() => setError("Khong the tai danh sach dia diem."));
  }, []);

  const imagePreviews = useMemo(() => imageFiles.map((file) => ({ file, url: URL.createObjectURL(file) })), [imageFiles]);
  const videoPreviews = useMemo(() => videoFiles.map((file) => ({ file, url: URL.createObjectURL(file) })), [videoFiles]);

  useEffect(() => () => {
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    videoPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [imagePreviews, videoPreviews]);

  const appendFiles = (selected: FileList | null, kind: "image" | "video") => {
    if (!selected) return;
    setError(null);
    const config = kind === "image"
      ? { allowed: allowedImageTypes, maxSize: maxImageSize, maxFiles: maxImages, current: imageFiles, setFiles: setImageFiles, label: "anh" }
      : { allowed: allowedVideoTypes, maxSize: maxVideoSize, maxFiles: maxVideos, current: videoFiles, setFiles: setVideoFiles, label: "video" };
    const next = [...config.current];
    for (const file of Array.from(selected)) {
      if (!config.allowed.includes(file.type)) {
        setError(`File ${config.label} khong dung dinh dang.`);
        continue;
      }
      if (file.size > config.maxSize) {
        setError(`${config.label} qua lon.`);
        continue;
      }
      if (next.length >= config.maxFiles) {
        setError(`Toi da ${config.maxFiles} ${config.label}.`);
        break;
      }
      next.push(file);
    }
    config.setFiles(next);
  };

  const submit = async (isDraft: boolean) => {
    if (isLoading) return;
    if (!content.trim()) {
      setError("Vui long nhap noi dung bai viet.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [images, videos] = await Promise.all([
        imageFiles.length ? uploadPostImages(imageFiles) : Promise.resolve([]),
        videoFiles.length ? uploadPostVideos(videoFiles) : Promise.resolve([]),
      ]);
      await createReviewPost({
        title: title.trim(),
        content: content.trim(),
        place_id: placeId ? Number(placeId) : null,
        images,
        videos,
        hashtags: hashtags.split(/[,\s]+/).map((tag) => tag.replace(/^#/, "").trim()).filter(Boolean),
        tagged_users: taggedUsers.split(/[,\s]+/).map((user) => user.replace(/^@/, "").trim()).filter(Boolean),
        visibility,
        is_draft: isDraft,
      });
      navigate("/community", { replace: true, state: { notice: isDraft ? "Da luu nhap." : "Dang bai thanh cong!" } });
    } catch {
      setError("Khong the luu bai viet. Vui long dang nhap va kiem tra lai thong tin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold">Dang bai review du lich</h1>
      <p className="mt-3 text-muted-foreground">Chia se trai nghiem, anh, video va ghi chu thuc te cho cong dong QuangBinhGo.</p>
      <Card className="mt-8">
        <CardHeader><CardTitle>Noi dung bai viet</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <Input onChange={(event) => setTitle(event.target.value)} placeholder="Tieu de bai viet" value={title} />
          <select className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setPlaceId(event.target.value)} value={placeId}>
            <option value="">Gan dia diem (khong bat buoc)</option>
            {places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
          </select>
          <Textarea onChange={(event) => setContent(event.target.value)} placeholder="Chuyen di co gi dang nho? Them #phongnha #quangbinh neu muon." value={content} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input onChange={(event) => setHashtags(event.target.value)} placeholder="Hashtags: phongnha, quangbinh" value={hashtags} />
            <Input onChange={(event) => setTaggedUsers(event.target.value)} placeholder="Tag users: username1, username2" value={taggedUsers} />
          </div>
          <select className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setVisibility(event.target.value as "public" | "followers" | "private")} value={visibility}>
            <option value="public">Public</option>
            <option value="followers">Followers only</option>
            <option value="private">Private</option>
          </select>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex h-32 cursor-pointer items-center justify-center rounded-md border border-dashed bg-muted/40 text-sm text-muted-foreground hover:bg-muted">
              <ImagePlus className="mr-2 h-5 w-5" />Chon anh
              <input accept="image/jpeg,image/png,image/webp" className="hidden" multiple onChange={(event) => appendFiles(event.target.files, "image")} type="file" />
            </label>
            <label className="flex h-32 cursor-pointer items-center justify-center rounded-md border border-dashed bg-muted/40 text-sm text-muted-foreground hover:bg-muted">
              <FileVideo className="mr-2 h-5 w-5" />Chon video
              <input accept="video/mp4,video/webm,video/quicktime" className="hidden" multiple onChange={(event) => appendFiles(event.target.files, "video")} type="file" />
            </label>
          </div>
          {imagePreviews.length > 0 && <PreviewGrid previews={imagePreviews} onRemove={(index) => setImageFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="image" />}
          {videoPreviews.length > 0 && <PreviewGrid previews={videoPreviews} onRemove={(index) => setVideoFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="video" />}
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2" disabled={isLoading} onClick={() => void submit(false)}><Send className="h-4 w-4" />{isLoading ? "Dang luu..." : "Publish"}</Button>
            <Button className="gap-2" disabled={isLoading} onClick={() => void submit(true)} variant="outline"><Save className="h-4 w-4" />Save draft</Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function PreviewGrid({ previews, onRemove, type }: { previews: { file: File; url: string }[]; onRemove: (index: number) => void; type: "image" | "video" }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {previews.map((preview, index) => (
        <div className="relative overflow-hidden rounded-md border" key={`${preview.file.name}-${index}`}>
          {type === "image" ? <img alt={preview.file.name} className="h-28 w-full object-cover" src={preview.url} /> : <video className="h-28 w-full bg-black object-cover" src={preview.url} />}
          <button className="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow" onClick={() => onRemove(index)} type="button"><X className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}
