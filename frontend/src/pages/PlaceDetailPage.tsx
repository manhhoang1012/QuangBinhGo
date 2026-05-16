import { useEffect, useState } from "react";
import { CalendarDays, ExternalLink, Heart, MapPin, Phone, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceImageGallery } from "@/components/places/PlaceImageGallery";
import { PlaceLocationMap } from "@/components/places/PlaceLocationMap";
import { type Place, type PlaceReview, type ReviewPost, type User } from "@/services/api";
import { createPlaceReview, deletePlaceReview, getPlace, getPlaceReviews, updatePlaceReview } from "@/services/placeApi";
import { getCommunityFeed } from "@/services/postApi";
import { getCurrentProfile } from "@/services/userApi";

export function PlaceDetailPage() {
  const { placeId } = useParams();
  const [place, setPlace] = useState<Place | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<ReviewPost[]>([]);
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlace = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const placeData = await getPlace(placeId ?? "");
        setPlace(placeData);
        const [feed, reviewData] = await Promise.all([getCommunityFeed("latest"), getPlaceReviews(placeData.id)]);
        setRelatedPosts(feed.filter((post) => post.place_id === placeData.id));
        setReviews(reviewData);
        try {
          const user = await getCurrentProfile();
          setCurrentUser(user);
          const ownReview = reviewData.find((review) => review.author.id === user.id);
          if (ownReview) {
            setReviewRating(ownReview.rating);
            setReviewContent(ownReview.content);
          }
        } catch {
          setCurrentUser(null);
        }
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

  const ownReview = currentUser ? reviews.find((review) => review.author.id === currentUser.id) : null;

  const reloadReviews = async () => {
    const [placeData, reviewData] = await Promise.all([getPlace(place.id), getPlaceReviews(place.id)]);
    setPlace(placeData);
    setReviews(reviewData);
  };

  const submitReview = async () => {
    if (!reviewContent.trim()) {
      setReviewNotice("Vui lòng nhập nội dung đánh giá.");
      return;
    }
    try {
      if (ownReview) {
        await updatePlaceReview(place.id, ownReview.id, { rating: reviewRating, content: reviewContent.trim() });
        setReviewNotice("Đã cập nhật đánh giá.");
      } else {
        await createPlaceReview(place.id, { rating: reviewRating, content: reviewContent.trim() });
        setReviewNotice("Đã gửi đánh giá.");
      }
      await reloadReviews();
    } catch {
      setReviewNotice("Không thể lưu đánh giá. Mỗi tài khoản chỉ đánh giá một lần cho mỗi địa điểm.");
    }
  };

  const removeReview = async (review: PlaceReview) => {
    if (!window.confirm("Xóa đánh giá này?")) return;
    try {
      await deletePlaceReview(place.id, review.id);
      setReviewContent("");
      setReviewRating(5);
      setReviewNotice("Đã xóa đánh giá.");
      await reloadReviews();
    } catch {
      setReviewNotice("Bạn chỉ có thể xóa đánh giá của chính mình.");
    }
  };

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

          <section className="mt-10">
            <h2 className="text-2xl font-semibold">Đánh giá địa điểm</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {Number(place.rating_avg).toFixed(1)} sao từ {place.review_count ?? reviews.length} lượt đánh giá
            </p>
            {reviewNotice && <div className="mt-4 rounded-md border bg-muted/40 p-3 text-sm">{reviewNotice}</div>}
            {currentUser ? (
              <Card className="mt-4">
                <CardContent className="space-y-3 pt-5">
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        className={`rounded-md border px-3 py-2 text-sm ${reviewRating >= star ? "bg-secondary text-secondary-foreground" : "bg-background"}`}
                        key={star}
                        onClick={() => setReviewRating(star)}
                        type="button"
                      >
                        {star} sao
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onChange={(event) => setReviewContent(event.target.value)}
                    placeholder="Viết cảm nhận của bạn về địa điểm này"
                    value={reviewContent}
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => void submitReview()}>{ownReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}</Button>
                    {ownReview && <Button onClick={() => void removeReview(ownReview)} variant="outline">Xóa đánh giá</Button>}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="mt-4">
                <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">Đăng nhập để đánh giá địa điểm này.</p>
                  <Link to="/login"><Button>Đăng nhập</Button></Link>
                </CardContent>
              </Card>
            )}
            <div className="mt-4 grid gap-4">
              {reviews.length === 0 && <Card><CardContent className="pt-5 text-sm text-muted-foreground">Chưa có đánh giá nào.</CardContent></Card>}
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {review.author.avatar_url ? <img alt={review.author.full_name} className="h-full w-full object-cover" src={review.author.avatar_url} /> : review.author.full_name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-medium">{review.author.full_name}</p>
                        <p className="text-sm text-muted-foreground">{review.rating}/5 sao - {new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{review.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
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
