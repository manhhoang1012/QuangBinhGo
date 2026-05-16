import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Send, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Place } from "@/services/api";
import { getPlaces } from "@/services/placeApi";
import { createReviewPost, uploadPostImages } from "@/services/postApi";

const maxImages = 10;
const maxImageSize = 5 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const communityFeedRoute = "/community";

export function CreatePostPage() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState<Place[]>([]);
  const [title, setTitle] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getPlaces({ limit: 100 })
      .then(setPlaces)
      .catch(() => setError("Không thể tải danh sách địa điểm."));
  }, []);

  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    setError(null);
    const next = [...files];
    for (const file of Array.from(selected)) {
      if (!allowedTypes.includes(file.type)) {
        setError("Chỉ hỗ trợ ảnh jpg, png hoặc webp.");
        continue;
      }
      if (file.size > maxImageSize) {
        setError("Mỗi ảnh phải nhỏ hơn hoặc bằng 5MB.");
        continue;
      }
      if (next.length >= maxImages) {
        setError("Mỗi bài viết tối đa 10 ảnh.");
        break;
      }
      next.push(file);
    }
    setFiles(next);
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    if (!title.trim() || !content.trim() || !placeId) {
      setError("Vui lòng nhập tiêu đề, nội dung và chọn địa điểm.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const uploadedUrls = files.length > 0 ? await uploadPostImages(files) : [];
      await createReviewPost({
        title: title.trim(),
        content: content.trim(),
        place_id: Number(placeId),
        images: uploadedUrls,
      });

      navigate(communityFeedRoute, {
        replace: true,
        state: { notice: "Đăng bài thành công!" },
      });
    } catch {
      setError("Không thể đăng bài. Vui lòng đăng nhập và kiểm tra lại thông tin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold">Đăng bài review du lịch</h1>
      <p className="mt-3 text-muted-foreground">Chia sẻ trải nghiệm, ảnh và ghi chú thực tế cho cộng đồng QuangBinhGo.</p>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Nội dung bài viết</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <Input onChange={(event) => setTitle(event.target.value)} placeholder="Tiêu đề bài viết" value={title} />
          <select
            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => setPlaceId(event.target.value)}
            value={placeId}
          >
            <option value="">Chọn địa điểm</option>
            {places.map((place) => (
              <option key={place.id} value={place.id}>{place.name}</option>
            ))}
          </select>
          <Textarea onChange={(event) => setContent(event.target.value)} placeholder="Chuyến đi có gì đáng nhớ?" value={content} />
          <label className="flex h-36 w-full cursor-pointer items-center justify-center rounded-md border border-dashed bg-muted/40 text-sm text-muted-foreground hover:bg-muted">
            <ImagePlus className="mr-2 h-5 w-5" />
            Chọn nhiều ảnh từ máy
            <input accept="image/jpeg,image/png,image/webp" className="hidden" multiple onChange={(event) => handleFiles(event.target.files)} type="file" />
          </label>
          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {previews.map((preview, index) => (
                <div className="relative overflow-hidden rounded-md border" key={`${preview.file.name}-${index}`}>
                  <img alt={`Ảnh bài viết ${index + 1}`} className="h-28 w-full object-cover" src={preview.url} />
                  <button
                    className="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow"
                    onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <Button className="gap-2" disabled={isLoading} onClick={() => void handleSubmit()}>
            <Send className="h-4 w-4" />
            {isLoading ? "Đang đăng..." : "Đăng bài"}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
