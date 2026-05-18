import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { getPlaces } from "@/services/placeApi";
import { getCommunityFeed } from "@/services/postApi";
import { type Place, type ReviewPost } from "@/services/api";

export function QuickSearch({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setPlaces([]);
      setPosts([]);
      return;
    }
    const timeoutId = window.setTimeout(async () => {
      try {
        const [placeResults, feedResults] = await Promise.all([
          getPlaces({ q: query.trim(), limit: 4 }),
          getCommunityFeed("latest", { limit: 8 }),
        ]);
        setPlaces(placeResults.slice(0, 4));
        setPosts(feedResults.filter((post) => `${post.title} ${post.content}`.toLowerCase().includes(query.toLowerCase())).slice(0, 4));
        setOpen(true);
      } catch {
        setOpen(false);
      }
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const submit = () => {
    if (!query.trim()) return;
    setOpen(false);
    onNavigate?.();
    navigate(`/places?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="relative w-full md:w-72">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        className="pl-9"
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
          if (event.key === "Escape") setOpen(false);
        }}
        placeholder="Tìm nhanh..."
        value={query}
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-md border bg-background shadow-lg">
          {[...places.map((place) => ({ key: `place-${place.id}`, label: place.name, sub: place.address, to: `/places/${place.slug || place.id}` })), ...posts.map((post) => ({ key: `post-${post.id}`, label: post.title || "Bài viết cộng đồng", sub: post.author.full_name, to: `/community/${post.id}` }))].map((item) => (
            <Link className="block px-3 py-2 text-sm hover:bg-muted" key={item.key} onClick={() => { setOpen(false); onNavigate?.(); }} to={item.to}>
              <p className="font-medium">{item.label}</p>
              <p className="line-clamp-1 text-xs text-muted-foreground">{item.sub}</p>
            </Link>
          ))}
          {places.length === 0 && posts.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">Không có kết quả.</p>}
        </div>
      )}
    </div>
  );
}
