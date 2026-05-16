import { useEffect, useState } from "react";
import { CalendarDays, ExternalLink, Heart, MapPin, Phone, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceImageGallery } from "@/components/places/PlaceImageGallery";
import { PlaceLocationMap } from "@/components/places/PlaceLocationMap";
import { type Place, type ReviewPost } from "@/services/api";
import { getPlace } from "@/services/placeApi";
import { getCommunityFeed } from "@/services/postApi";

export function PlaceDetailPage() {
  const { placeId } = useParams();
  const [place, setPlace] = useState<Place | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<ReviewPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlace = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const placeData = await getPlace(placeId ?? "");
        setPlace(placeData);
        const feed = await getCommunityFeed("latest");
        setRelatedPosts(feed.filter((post) => post.place_id === placeData.id));
      } catch {
        setError("Không thể tải thông tin địa điểm.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadPlace();
  }, [placeId]);

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-muted-foreground">Đang tải địa điểm...</div>;
  }

  if (error || !place) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-destructive">{error ?? "Không tìm thấy địa điểm."}</div>;
  }

  return (
    <section>
      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Badge>{place.category}</Badge>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-5xl">{place.name}</h1>
          <p className="mt-4 flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5" />
            {place.address}
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div>
          <PlaceImageGallery images={place.images ?? []} placeName={place.name} />

          <div className="mt-8 flex flex-wrap gap-3">
            <Badge className="bg-secondary text-secondary-foreground">
              <Star className="mr-1 h-3.5 w-3.5 fill-current" />
              {Number(place.rating_avg).toFixed(1)} sao
            </Badge>
            <Badge>{place.review_count ?? 0} đánh giá</Badge>
            {place.tags?.map((tag) => (
              <Badge className="bg-muted text-foreground" key={tag}>
                {tag}
              </Badge>
            ))}
          </div>

          <h2 className="mt-6 text-2xl font-semibold">Tổng quan</h2>
          <p className="mt-3 max-w-3xl leading-8 text-muted-foreground">{place.description}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <InfoCard title="Giờ mở cửa" value={place.opening_hours || "Đang cập nhật"} />
            <InfoCard title="Giá vé" value={place.ticket_price || "Đang cập nhật"} />
            <InfoCard title="Liên hệ" value={[place.contact_phone, place.contact_email].filter(Boolean).join(" - ") || "Đang cập nhật"} />
            <Card>
              <CardContent className="space-y-2 pt-5">
                <p className="text-sm text-muted-foreground">Website/Facebook</p>
                <div className="flex flex-wrap gap-2">
                  {place.website_url && <ExternalButton href={place.website_url} label="Website" />}
                  {place.facebook_url && <ExternalButton href={place.facebook_url} label="Facebook" />}
                  {!place.website_url && !place.facebook_url && <p className="font-medium">Đang cập nhật</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {place.videos && place.videos.length > 0 && (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">Video</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {place.videos.map((video) => (
                  <VideoEmbed key={video} url={video} />
                ))}
              </div>
            </section>
          )}

          <PlaceLocationMap
            address={place.address}
            latitude={place.latitude}
            longitude={place.longitude}
            placeName={place.name}
          />

          {place.related_places && place.related_places.length > 0 && (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold">Địa điểm liên quan</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {place.related_places.map((related) => (
                  <Link key={related.id} to={`/places/${related.slug || related.id}`}>
                    <Card className="h-full overflow-hidden transition-transform hover:-translate-y-1">
                      <img
                        alt={related.name}
                        className="h-36 w-full object-cover"
                        src={related.cover_image || related.images?.[0] || "https://placehold.co/600x400?text=QuangBinhGo"}
                      />
                      <CardContent className="pt-4">
                        <Badge>{related.category}</Badge>
                        <h3 className="mt-3 font-semibold">{related.name}</h3>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{related.address}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <h2 className="mt-10 text-2xl font-semibold">Bài viết trải nghiệm</h2>
          <div className="mt-4 grid gap-4">
            {relatedPosts.length === 0 && (
              <Card>
                <CardContent className="pt-5 text-sm text-muted-foreground">Chưa có bài viết trải nghiệm cho địa điểm này.</CardContent>
              </Card>
            )}
            {relatedPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="pt-5">
                  <p className="text-sm text-muted-foreground">
                    {post.author.full_name} - {new Date(post.created_at).toLocaleDateString()}
                  </p>
                  <h3 className="mt-2 font-semibold">{post.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{post.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lên kế hoạch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full gap-2">
                <CalendarDays className="h-4 w-4" />
                Thêm vào lịch trình
              </Button>
              <Button className="w-full gap-2" variant="outline">
                <Heart className="h-4 w-4" />
                Lưu địa điểm
              </Button>
              <Link to="/community/new">
                <Button className="w-full" variant="secondary">Viết bài trải nghiệm</Button>
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </section>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-5">
        <Phone className="mt-1 h-5 w-5 text-primary" />
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="font-medium">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ExternalButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} rel="noreferrer" target="_blank">
      <Button className="gap-2" type="button" variant="outline">
        <ExternalLink className="h-4 w-4" />
        {label}
      </Button>
    </a>
  );
}

function VideoEmbed({ url }: { url: string }) {
  const embedUrl = toYouTubeEmbed(url);
  if (embedUrl) {
    return <iframe allowFullScreen className="aspect-video w-full rounded-lg border" src={embedUrl} title="Place video" />;
  }
  return (
    <video className="aspect-video w-full rounded-lg border object-cover" controls src={url}>
      <track kind="captions" />
    </video>
  );
}

function toYouTubeEmbed(url: string) {
  try {
    const parsed = new URL(url);
    const id = parsed.hostname.includes("youtu.be") ? parsed.pathname.slice(1) : parsed.searchParams.get("v");
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
}
