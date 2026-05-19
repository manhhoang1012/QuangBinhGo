import { useEffect, useState } from "react";
import { ArrowRight, Bot, CalendarDays, Hash, MapPin, MapPinned, MessageCircle, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/seo/SEO";
import { type Place, type ReviewPost } from "@/services/api";
import { getTrendingPlaces, getTrendingPosts } from "@/services/analyticsApi";
import { getPlaces } from "@/services/placeApi";
import { getCommunityFeed } from "@/services/postApi";
import { fallbackSettings, getPublicSettings, type SiteSettings } from "@/services/settingsApi";

export function HomePage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(fallbackSettings);
  const [trendingPlaces, setTrendingPlaces] = useState<Place[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<ReviewPost[]>([]);

  useEffect(() => {
    void getPlaces().then(setPlaces).catch(() => setPlaces([]));
    void getCommunityFeed("latest").then(setPosts).catch(() => setPosts([]));
    void getTrendingPlaces(3).then(setTrendingPlaces).catch(() => setTrendingPlaces([]));
    void getTrendingPosts(3).then(setTrendingPosts).catch(() => setTrendingPosts([]));
    void getPublicSettings().then(setSettings).catch(() => setSettings(fallbackSettings));
  }, []);

  const stats = [
    { label: "Places", value: String(places.length) },
    { label: "Reviews", value: String(posts.length) },
    { label: "Travelers", value: "-" },
    { label: "Saved trips", value: "-" },
  ];
  const aiCards = [
    { title: "Tìm kiếm AI", description: "Hỏi bằng ngôn ngữ tự nhiên để tìm places và review.", to: "/ai/search", icon: Search },
    { title: "Gợi ý địa điểm", description: "Đề xuất theo sở thích, ngân sách và kiểu du lịch.", to: "/ai/recommendations", icon: MapPinned },
    { title: "Chatbot du lịch", description: "Hỏi nhanh về mùa đi, ăn uống, chi phí và lịch trình.", to: "/ai/chatbot", icon: Bot },
    { title: "Tạo lịch trình", description: "Tạo lịch trình nhiều ngày bằng Gemini AI.", to: "/ai/itinerary", icon: CalendarDays },
    { title: "Gợi ý caption/hashtag", description: "Viết review nhanh hơn với công cụ nội dung AI.", to: "/ai/content-tools", icon: Hash },
  ];

  return (
    <>
      <SEO
        title="QuangBinhGo - Khám phá du lịch Quảng Bình"
        description="Khám phá địa điểm du lịch Quảng Bình, đọc review cộng đồng, tạo lịch trình và tìm gợi ý bằng AI."
        url="/"
        keywords="du lịch Quảng Bình, Phong Nha, Nhật Lệ, review du lịch, lịch trình Quảng Bình"
      />
      <section className="relative min-h-[680px] overflow-hidden">
        <img
          alt="Quang Binh limestone landscape"
          className="absolute inset-0 h-full w-full object-cover"
          src={settings.hero_background_image || fallbackSettings.hero_background_image || ""}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
        <div className="relative mx-auto flex min-h-[680px] max-w-7xl flex-col justify-center px-4 pb-20 pt-16 sm:px-6 lg:px-8">
          <Badge className="w-fit bg-white/15 text-white backdrop-blur">Quang Binh travel community</Badge>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight text-white sm:text-7xl">
            {settings.hero_title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85">
            {settings.hero_subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/places">
              <Button className="gap-2" variant="secondary">
                Explore places
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/community">
              <Button className="bg-white/10 text-white hover:bg-white/20" variant="ghost">
                Open community
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <Card key={item.label}>
              <CardContent className="pt-5">
                <p className="text-3xl font-semibold">{item.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-accent">
                <Sparkles className="h-4 w-4" />
                Gemini AI
              </p>
              <h2 className="mt-2 text-3xl font-semibold">Trợ lý AI du lịch Quảng Bình</h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">Tìm địa điểm, tạo lịch trình và viết review nhanh hơn với Gemini AI.</p>
            </div>
            <Link to="/ai">
              <Button variant="outline">Mở AI Hub</Button>
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {aiCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card className="h-full" key={card.to}>
                  <CardContent className="flex h-full flex-col pt-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                    <h3 className="mt-4 font-semibold">{card.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{card.description}</p>
                    <Link className="mt-4" to={card.to}>
                      <Button className="w-full" variant="secondary">Dùng ngay</Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {settings.show_featured_places && <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-accent">Featured places</p>
            <h2 className="mt-2 text-3xl font-semibold">Start with traveler favorites</h2>
          </div>
          <Link className="hidden text-sm font-medium text-primary hover:underline sm:block" to="/places">
            View all
          </Link>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {(trendingPlaces.length ? trendingPlaces : places).slice(0, settings.featured_place_limit).map((place) => (
            <Link key={place.id} to={`/places/${place.slug || place.id}`}>
              <Card className="h-full overflow-hidden transition-transform hover:-translate-y-1">
                  <img alt={place.name} className="h-56 w-full object-cover" src={place.images[0] ?? "https://placehold.co/1200x800?text=QuangBinhGo"} />
                <CardContent className="pt-5">
                  <Badge>{place.category}</Badge>
                  <h3 className="mt-4 text-xl font-semibold">{place.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{place.description}</p>
                  <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {place.address}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>}

      {settings.show_latest_posts && <section className="bg-muted/50 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-accent">
              <MessageCircle className="h-4 w-4" />
              Community pulse
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Fresh notes from recent trips</h2>
            <p className="mt-4 text-muted-foreground">
              See what travelers loved, saved, and recommended before you build your itinerary.
            </p>
          </div>
          <div className="grid gap-4">
            {posts.length === 0 && (
              <Card>
                <CardContent className="pt-5 text-sm text-muted-foreground">No community posts yet.</CardContent>
              </Card>
            )}
            {(trendingPosts.length ? trendingPosts : posts).slice(0, 2).map((post) => (
              <Card key={post.id}>
                <CardContent className="flex gap-4 pt-5">
                  <img alt={post.title} className="h-24 w-24 rounded-md object-cover" src={post.images[0] ?? post.place?.images?.[0] ?? "https://placehold.co/400x400?text=QuangBinhGo"} />
                  <div>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="h-4 w-4 text-secondary" />
                      {post.place?.name ?? "Community"} - {new Date(post.created_at).toLocaleDateString()}
                    </p>
                    <Link to={`/community/${post.slug || post.id}`}><h3 className="mt-2 font-semibold hover:text-primary">{post.title}</h3></Link>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>}
    </>
  );
}
