import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { PostCard } from "@/components/community/PostCard";
import { SuggestedUsers } from "@/components/social/SuggestedUsers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { InfiniteScrollLoader } from "@/components/common/InfiniteScrollLoader";
import { PostSkeleton } from "@/components/common/LoadingSkeleton";
import { showToast } from "@/components/common/toastStore";
import { SEO } from "@/components/seo/SEO";
import { type ReviewPost } from "@/services/api";
import { getCommunityFeed, hidePost, likePost, reportPost, savePost, sharePost, type FeedType } from "@/services/postApi";

const pageSize = 10;

export function CommunityFeedPage({ initialFeedType = "latest" }: { initialFeedType?: FeedType }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [feedType, setFeedType] = useState<FeedType>(initialFeedType);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const postsLengthRef = useRef(0);

  useEffect(() => {
    postsLengthRef.current = posts.length;
  }, [posts.length]);

  const loadFeed = useCallback(async (reset = false) => {
    if (reset) setIsLoading(true);
    else setIsLoadingMore(true);
    setError(null);
    try {
      const next = await getCommunityFeed(feedType, { skip: reset ? 0 : postsLengthRef.current, limit: pageSize });
      setPosts((current) => (reset ? next : [...current, ...next]));
      setHasMore(next.length === pageSize);
    } catch {
      setError(feedType === "following" || feedType === "saved" ? "Please sign in to view this feed." : "Could not load the community feed.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [feedType]);

  useEffect(() => {
    const state = location.state as { notice?: string } | null;
    if (state?.notice) {
      setNotice(state.notice);
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    void loadFeed(true);
  }, [loadFeed]);

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
    showToast("Đã gửi báo cáo.", "success");
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <SEO
        title="Cộng đồng review du lịch Quảng Bình | QuangBinhGo"
        description="Đọc review du lịch Quảng Bình từ cộng đồng, chia sẻ trải nghiệm, ảnh, mẹo đi chơi và địa điểm đáng thử."
        url="/community"
        keywords="review du lịch Quảng Bình, cộng đồng du lịch, kinh nghiệm Quảng Bình"
      />
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
      {error && <div className="mt-8"><ErrorState message={error} onRetry={() => void loadFeed(true)} /></div>}
      {isLoading && <div className="mt-8"><PostSkeleton /></div>}
      {!isLoading && !error && posts.length === 0 && <div className="mt-8"><EmptyState title="Chưa có bài viết" description="Theo dõi thêm người dùng hoặc tạo bài review đầu tiên của bạn." actionLabel="Tạo bài viết" onAction={() => navigate("/community/new")} /></div>}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-5">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onHide={(item) => void hidePost(item.id).then(() => { setPosts((current) => current.filter((post) => post.id !== item.id)); showToast("Đã ẩn bài viết.", "success"); }).catch(() => setError("Please sign in before hiding posts."))}
              onLike={(item) => void likePost(item.id).then(refreshCounts).catch(() => setError("Please sign in before liking posts."))}
              onReport={(item) => void report(item).catch(() => setError("Could not report this post."))}
              onSave={(item) => void savePost(item.id).then(() => { showToast("Đã lưu bài viết.", "success"); return refreshCounts(); }).catch(() => setError("Please sign in before saving posts."))}
              onShare={(item) => void sharePost(item.id, item.slug).then(() => { showToast("Đã sao chép/chia sẻ liên kết.", "success"); return refreshCounts(); }).catch(() => setError("Could not share this post."))}
            />
          ))}
        </div>
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <SuggestedUsers />
        </aside>
      </div>
      <div ref={sentinelRef} className="h-10" />
      <InfiniteScrollLoader isLoading={isLoadingMore} hasMore={hasMore || posts.length === 0} />
    </section>
  );
}

