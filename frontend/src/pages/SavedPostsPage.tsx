import { useEffect, useState } from "react";

import { PostCard } from "@/components/community/PostCard";
import { Card } from "@/components/ui/card";
import { type ReviewPost } from "@/services/api";
import { getSavedPosts, likePost, reportPost, savePost, sharePost } from "@/services/postApi";

export function SavedPostsPage() {
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSaved = async () => {
    setError(null);
    setPosts(await getSavedPosts({ limit: 50 }));
    setIsLoading(false);
  };

  useEffect(() => {
    void loadSaved().catch(() => {
      setError("Could not load saved posts. Please sign in and try again.");
      setIsLoading(false);
    });
  }, []);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold">Saved posts</h1>
      {isLoading && <Card className="mt-8 h-48 animate-pulse bg-muted/50" />}
      {error && <div className="mt-8 rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">{error}</div>}
      {!isLoading && posts.length === 0 && <div className="mt-8 rounded-lg border bg-muted/40 p-8 text-center text-muted-foreground">No saved posts yet.</div>}
      <div className="mt-8 grid gap-5">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={(item) => void likePost(item.id).then(loadSaved)}
            onReport={(item) => { const reason = window.prompt("Ly do bao cao?"); if (reason) void reportPost(item.id, reason); }}
            onSave={(item) => void savePost(item.id).then(loadSaved)}
            onShare={(item) => void sharePost(item.id).then(loadSaved)}
          />
        ))}
      </div>
    </section>
  );
}
