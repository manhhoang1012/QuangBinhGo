import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { aiRecommendPlaces, aiSearch, type AiSearchResponse } from "@/services/aiApi";

export function AiSearchPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | "places" | "posts">("all");
  const [data, setData] = useState<AiSearchResponse | null>(null);
  const [recommendations, setRecommendations] = useState<Array<{ place: { id: number; slug?: string | null; name: string }; reason: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await aiSearch(query, type, 8);
      setData(result);
      const tags = [
        ...((result.intent.tags as string[] | undefined) ?? []),
        ...((result.intent.categories as string[] | undefined) ?? []),
      ];
      const recommended = await aiRecommendPlaces({ interests: tags.length ? tags : [query], travel_style: String(result.intent.travel_style ?? ""), days: 3 });
      setRecommendations(recommended.recommended_places);
    } catch {
      setError("Không thể tìm kiếm bằng AI. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="flex items-center gap-2 text-sm font-medium text-primary"><Sparkles className="h-4 w-4" /> Gemini powered</p>
        <h1 className="mt-3 text-4xl font-semibold">AI Search</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tìm địa điểm và bài review bằng ngôn ngữ tự nhiên, Gemini sẽ phân tích nhu cầu rồi đối chiếu dữ liệu thật.</p>
      </div>
      <div className="mt-6 grid gap-2 md:grid-cols-[1fr_180px_auto]">
        <Input className="h-12" onChange={(event) => setQuery(event.target.value)} placeholder="Ví dụ: Tôi muốn đi nơi mát mẻ, có hang động và phù hợp gia đình" value={query} />
        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={type} onChange={(event) => setType(event.target.value as "all" | "places" | "posts")}>
          <option value="all">Tất cả</option>
          <option value="places">Địa điểm</option>
          <option value="posts">Bài review</option>
        </select>
        <Button className="gap-2" disabled={isLoading || !query.trim()} onClick={() => void handleSearch()}>
          <Search className="h-4 w-4" />
          {isLoading ? "Đang tìm..." : "Tìm kiếm bằng AI"}
        </Button>
      </div>
      {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">{error}</div>}
      {data && <p className="mt-4 text-sm text-muted-foreground">Nguồn: {data.source} · Intent: {JSON.stringify(data.intent)}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Địa điểm phù hợp</h2>
          {data?.places.length === 0 && <Card><CardContent className="pt-5 text-sm text-muted-foreground">Chưa tìm thấy địa điểm phù hợp.</CardContent></Card>}
          {data?.places.map((place) => (
            <Card key={place.id}>
              <CardContent className="flex gap-4 pt-5">
                <img alt={place.name} className="h-24 w-32 rounded-md object-cover" src={place.cover_image || place.images?.[0] || "https://placehold.co/320x240?text=QuangBinhGo"} />
                <div>
                  <Link to={`/places/${place.slug || place.id}`}><h3 className="font-semibold hover:text-primary">{place.name}</h3></Link>
                  <p className="mt-1 text-sm text-muted-foreground">{place.category} · {place.region || place.address}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{place.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          <h2 className="pt-4 text-2xl font-semibold">Bài review liên quan</h2>
          {data?.posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="pt-5">
                <p className="text-sm text-muted-foreground">{post.place?.name ?? "Community"} · {new Date(post.created_at).toLocaleDateString("vi-VN")}</p>
                <Link to={`/community/${post.id}`}><h3 className="mt-2 font-semibold hover:text-primary">{post.title || "Bài viết trải nghiệm"}</h3></Link>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <aside className="space-y-4">
          <h2 className="text-xl font-semibold">Gemini đề xuất</h2>
          {recommendations.map((item) => (
            <Card key={item.place.id}>
              <CardContent className="pt-5">
                <Link to={`/places/${item.place.slug || item.place.id}`}><h3 className="font-semibold hover:text-primary">{item.place.name}</h3></Link>
                <p className="mt-2 text-sm text-muted-foreground">{item.reason}</p>
              </CardContent>
            </Card>
          ))}
        </aside>
      </div>
    </section>
  );
}
