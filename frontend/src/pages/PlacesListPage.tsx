import { useEffect, useMemo, useState } from "react";
import { LocateFixed, MapPin, Search, Star } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { Pagination } from "@/components/common/Pagination";
import { type Place } from "@/services/api";
import { getPlaces } from "@/services/placeApi";

const categories = [
  { label: "Tất cả", value: "" },
  { label: "Biển", value: "beach" },
  { label: "Hang động", value: "cave" },
  { label: "Ăn uống", value: "food" },
  { label: "Nghỉ dưỡng", value: "resort" },
  { label: "Lịch sử", value: "historical" },
  { label: "Thiên nhiên", value: "nature" },
];
const tagOptions = ["Check-in", "Gia đình", "Phượt", "Gần trung tâm"];
const imageFallback = "https://placehold.co/1200x800?text=QuangBinhGo";
const pageSize = 9;

export function PlacesListPage() {
  const [searchParams] = useSearchParams();
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [minRating, setMinRating] = useState("");
  const [priceType, setPriceType] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [nearMe, setNearMe] = useState<{ lat: number; lng: number } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialQuery = searchParams.get("q");
    if (initialQuery) setSearch(initialQuery);
  }, [searchParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    const loadPlaces = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPlaces({
          q: debouncedSearch || undefined,
          category: selectedCategory || undefined,
          tags: selectedTag || undefined,
          min_rating: minRating ? Number(minRating) : undefined,
          price_type: priceType || undefined,
          near_lat: nearMe?.lat,
          near_lng: nearMe?.lng,
          radius_km: nearMe ? 80 : undefined,
          sort: nearMe ? "distance_asc" : sort,
          page,
          limit: pageSize,
        });
        setPlaces(data);
      } catch {
        setError("Không thể tải danh sách địa điểm. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadPlaces();
  }, [debouncedSearch, selectedCategory, selectedTag, minRating, priceType, sort, nearMe, page, reloadKey]);

  const activateNearMe = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ định vị.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNearMe({ lat: position.coords.latitude, lng: position.coords.longitude });
        setPage(1);
        setIsLocating(false);
      },
      () => {
        setError("Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền định vị của trình duyệt.");
        setIsLocating(false);
      },
    );
  };

  const hasFilters = useMemo(
    () => Boolean(selectedCategory || selectedTag || minRating || priceType || debouncedSearch || nearMe),
    [debouncedSearch, minRating, nearMe, priceType, selectedCategory, selectedTag],
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Badge>Explore Quang Binh</Badge>
          <h1 className="mt-4 text-4xl font-semibold">Khám phá du lịch Quảng Bình</h1>
          <p className="mt-4 text-muted-foreground">
            Tìm hang động, biển, suối, điểm check-in và trải nghiệm địa phương theo nhu cầu của bạn.
          </p>
        </div>
        <div className="rounded-lg border bg-muted/40 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên hoặc từ khóa" value={search} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <select className="rounded-md border bg-background px-3 py-2 text-sm" onChange={(event) => { setSelectedCategory(event.target.value); setPage(1); }} value={selectedCategory}>
              {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
            </select>
            <select className="rounded-md border bg-background px-3 py-2 text-sm" onChange={(event) => { setSelectedTag(event.target.value); setPage(1); }} value={selectedTag}>
              <option value="">Tất cả trải nghiệm</option>
              {tagOptions.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
            </select>
            <select className="rounded-md border bg-background px-3 py-2 text-sm" onChange={(event) => { setPriceType(event.target.value); setPage(1); }} value={priceType}>
              <option value="">Tất cả giá vé</option>
              <option value="free">Miễn phí</option>
              <option value="paid">Có phí</option>
            </select>
            <select className="rounded-md border bg-background px-3 py-2 text-sm" onChange={(event) => { setMinRating(event.target.value); setPage(1); }} value={minRating}>
              <option value="">Tất cả rating</option>
              <option value="4">Từ 4 sao</option>
              <option value="3">Từ 3 sao</option>
            </select>
            <select className="rounded-md border bg-background px-3 py-2 text-sm" disabled={Boolean(nearMe)} onChange={(event) => setSort(event.target.value)} value={nearMe ? "distance_asc" : sort}>
              <option value="newest">Mới nhất</option>
              <option value="rating_desc">Rating cao</option>
              <option value="review_count_desc">Được đánh giá nhiều</option>
              <option value="price_asc">Giá thấp</option>
              <option value="distance_asc">Gần nhất</option>
            </select>
            <Button className="gap-2" disabled={isLocating} onClick={activateNearMe} variant={nearMe ? "secondary" : "outline"}>
              <LocateFixed className="h-4 w-4" />
              {isLocating ? "Đang định vị..." : nearMe ? "Đang tìm gần tôi" : "Gần tôi"}
            </Button>
          </div>
          {hasFilters && (
            <button className="mt-3 text-sm font-medium text-primary hover:underline" onClick={() => { setSelectedCategory(""); setSelectedTag(""); setMinRating(""); setPriceType(""); setSearch(""); setNearMe(null); setPage(1); }}>
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {isLoading && <div className="mt-8"><LoadingSkeleton count={6} className="h-96" grid /></div>}
      {error && <div className="mt-8"><ErrorState message={error} onRetry={() => setReloadKey((value) => value + 1)} /></div>}
      {!isLoading && !error && places.length === 0 && <div className="mt-8"><EmptyState title="Chưa có địa điểm phù hợp" description="Thử đổi từ khóa, danh mục hoặc xóa bộ lọc hiện tại." actionLabel="Xóa bộ lọc" onAction={() => { setSelectedCategory(""); setSelectedTag(""); setMinRating(""); setPriceType(""); setSearch(""); setNearMe(null); setPage(1); }} /></div>}

      {!isLoading && !error && places.length > 0 && (
        <>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {places.map((place) => <PlaceCard key={place.id} place={place} />)}
          </div>
          <div className="mt-8"><Pagination page={page} totalPages={places.length < pageSize ? page : undefined} onPageChange={setPage} /></div>
        </>
      )}
    </section>
  );
}

function PlaceCard({ place }: { place: Place }) {
  return (
    <Link to={`/places/${place.slug || place.id}`}>
      <Card className="h-full overflow-hidden transition-transform hover:-translate-y-1">
        <img alt={place.name} className="h-56 w-full object-cover" src={place.cover_image || place.images?.[0] || imageFallback} />
        <CardContent className="pt-5">
          <div className="flex items-center justify-between gap-3">
            <Badge>{place.category}</Badge>
            <span className="flex items-center gap-1 text-sm font-medium">
              <Star className="h-4 w-4 fill-secondary text-secondary" />
              {Number(place.rating_avg).toFixed(1)} ({place.review_count ?? 0})
            </span>
          </div>
          <h2 className="mt-4 text-xl font-semibold">{place.name}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{place.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">{place.tags?.slice(0, 3).map((tag) => <span className="rounded-md bg-muted px-2 py-1 text-xs" key={tag}>{tag}</span>)}</div>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{place.address}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium">{place.ticket_price || "Giá vé đang cập nhật"}</span>
            {place.distance_km != null && <span className="text-muted-foreground">{place.distance_km.toFixed(1)} km</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
