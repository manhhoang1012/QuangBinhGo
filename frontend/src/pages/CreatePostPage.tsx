import { useEffect, useState } from "react";
import { ImagePlus, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Place } from "@/services/api";
import { getPlaces } from "@/services/placeApi";
import { createReviewPost } from "@/services/postApi";

export function CreatePostPage() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState<Place[]>([]);
  const [title, setTitle] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getPlaces().then(setPlaces).catch(() => setError("Could not load places."));
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await createReviewPost({
        title,
        content,
        place_id: Number(placeId),
        images: imageUrl ? [imageUrl] : [],
      });
      navigate("/community");
    } catch {
      setError("Could not publish review. Please sign in and check all fields.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold">Create travel review</h1>
      <p className="mt-3 text-muted-foreground">Share a place, story, photos, and practical notes for other travelers.</p>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Review details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <Input onChange={(event) => setTitle(event.target.value)} placeholder="Post title" value={title} />
          <select
            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => setPlaceId(event.target.value)}
            value={placeId}
          >
            <option value="">Select place</option>
            {places.map((place) => (
              <option key={place.id} value={place.id}>{place.name}</option>
            ))}
          </select>
          <Textarea onChange={(event) => setContent(event.target.value)} placeholder="What made this trip memorable?" value={content} />
          <Input onChange={(event) => setImageUrl(event.target.value)} placeholder="Image URL optional" value={imageUrl} />
          <button className="flex h-36 w-full items-center justify-center rounded-md border border-dashed bg-muted/40 text-sm text-muted-foreground">
            <ImagePlus className="mr-2 h-5 w-5" />
            Add photos
          </button>
          <Button className="gap-2" disabled={isLoading} onClick={() => void handleSubmit()}>
            <Send className="h-4 w-4" />
            {isLoading ? "Publishing..." : "Publish review"}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
