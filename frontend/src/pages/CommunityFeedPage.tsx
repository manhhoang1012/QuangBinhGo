import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { PostCard } from "@/components/community/PostCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type ReviewPost } from "@/services/api";
import { followUser, getCommunityFeed, hidePost, likePost, reportPost, savePost, sharePost, type FeedType } from "@/services/postApi";

const pageSize = 10;

export function CommunityFeedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [feedType, setFeedType] = useState<FeedType>("latest");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadFeed = useCallback(async (reset = false) => {
    reset ? setIsLoading(true) : setIsLoadingMore(true);
    setError(null);
    try {
      const next = await getCommunityFeed(feedType, { skip: reset ? 0 : posts.length, limit: pageSize });
      setPosts((current) => (reset ? next : [...current, ...next]));
      setHasMore(next.length === pageSize);
    } catch {
      setError(feedType === "following" || feedType === "saved" ? "Please sign in to view this feed." : "Could not load the community feed.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [feedType, posts.length]);

  useEffect(() => {
    const state = location.state as { notice?: string } | null;
    if (state?.notice) {
      setNotice(state.notice);
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    void loadFeed(true);
  }, [feedType]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) void loadFeed(false);
    }, { rootMargin: "300px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, loadFeed]);

  const refreshCounts = async () => loadFeed(true);
  const report = async (post: ReviewPost) => {
    const reason = window.prompt("Ly do bao cao bai viet?");
    if (!reason?.trim()) return;
    await reportPost(post.id, reason.trim());
    setNotice("Da gui bao cao. Cam on ban da giup cong dong an toan hon.");
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge>Community feed</Badge>
          <h1 className="mt-4 text-4xl font-semibold">Real trips, local tips, fresh ideas</h1>
        </div>
        <Link to="/community/new">
          <Button className="gap-2"><Plus className="h-4 w-4" />Create post</Button>
        </Link>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {(["latest", "trending", "following", "saved"] as FeedType[]).map((type) => (
          <Button key={type} onClick={() => setFeedType(type)} variant={feedType === type ? "secondary" : "outline"}>
            {type[0].toUpperCase() + type.slice(1)}
          </Button>
        ))}
      </div>

      {notice && <div className="mt-8 rounded-lg border bg-accent/10 p-5 text-sm text-accent">{notice}</div>}
      {error && <div className="mt-8 rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">{error}</div>}
      {isLoading && <Card className="mt-8 h-96 animate-pulse bg-muted/50" />}
      {!isLoading && !error && posts.length === 0 && <div className="mt-8 rounded-lg border bg-muted/40 p-8 text-center text-muted-foreground">No posts in this feed yet.</div>}
      <div className="mt-8 grid gap-5">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onFollow={(username) => username && void followUser(username).catch(() => setError("Please sign in before following users."))}
            onHide={(item) => void hidePost(item.id).then(() => setPosts((current) => current.filter((post) => post.id !== item.id))).catch(() => setError("Please sign in before hiding posts."))}
            onLike={(item) => void likePost(item.id).then(refreshCounts).catch(() => setError("Please sign in before liking posts."))}
            onReport={(item) => void report(item).catch(() => setError("Could not report this post."))}
            onSave={(item) => void savePost(item.id).then(refreshCounts).catch(() => setError("Please sign in before saving posts."))}
            onShare={(item) => void sharePost(item.id).then(refreshCounts).catch(() => setError("Could not share this post."))}
          />
        ))}
      </div>
      <div ref={sentinelRef} className="h-10" />
      {isLoadingMore && <Card className="mt-4 h-32 animate-pulse bg-muted/50" />}
      {!hasMore && posts.length > 0 && <p className="mt-6 text-center text-sm text-muted-foreground">No more posts.</p>}
    </section>
  );
}
