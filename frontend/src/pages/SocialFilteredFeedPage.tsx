import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { PostCard } from "@/components/community/PostCard";
import { Card } from "@/components/ui/card";
import { type ReviewPost } from "@/services/api";
import { getHashtagFeed, getPlaceFeed, hidePost, likePost, reportPost, savePost, sharePost } from "@/services/postApi";

const pageSize = 10;

export function SocialFilteredFeedPage({ mode }: { mode: "hashtag" | "place" }) {
  const params = useParams();
  const key = mode === "hashtag" ? params.tag : params.placeId;
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async (reset = false) => {
    if (!key) return;
    reset ? setIsLoading(true) : setIsLoadingMore(true);
    setError(null);
    try {
      const skip = reset ? 0 : posts.length;
      const next = mode === "hashtag"
        ? await getHashtagFeed(key, { skip, limit: pageSize })
        : await getPlaceFeed(Number(key), { skip, limit: pageSize });
      setPosts((current) => reset ? next : [...current, ...next]);
      setHasMore(next.length === pageSize);
    } catch {
      setError("Could not load this feed.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [key, mode, posts.length]);

  useEffect(() => {
    void load(true);
  }, [key, mode]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) void load(false);
    }, { rootMargin: "300px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, load]);

  const refresh = () => load(true);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold">{mode === "hashtag" ? `#${key}` : "Place community feed"}</h1>
      {error && <div className="mt-8 rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">{error}</div>}
      {isLoading && <Card className="mt-8 h-96 animate-pulse bg-muted/50" />}
      {!isLoading && posts.length === 0 && <div className="mt-8 rounded-lg border bg-muted/40 p-8 text-center text-muted-foreground">No posts yet.</div>}
      <div className="mt-8 grid gap-5">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onHide={(item) => void hidePost(item.id).then(() => setPosts((current) => current.filter((post) => post.id !== item.id)))}
            onLike={(item) => void likePost(item.id).then(refresh)}
            onReport={(item) => { const reason = window.prompt("Ly do bao cao?"); if (reason) void reportPost(item.id, reason); }}
            onSave={(item) => void savePost(item.id).then(refresh)}
            onShare={(item) => void sharePost(item.id).then(refresh)}
          />
        ))}
      </div>
      <div ref={sentinelRef} className="h-10" />
      {isLoadingMore && <Card className="mt-4 h-32 animate-pulse bg-muted/50" />}
      {!hasMore && posts.length > 0 && <p className="mt-6 text-center text-sm text-muted-foreground">No more posts.</p>}
    </section>
  );
}
