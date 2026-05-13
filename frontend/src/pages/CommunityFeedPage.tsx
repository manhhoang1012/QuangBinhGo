import { useEffect, useState } from "react";
import { Bookmark, Heart, MessageCircle, Plus } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type ReviewPost } from "@/services/api";
import { getCommunityFeed, likePost, savePost, type FeedSort } from "@/services/postApi";

export function CommunityFeedPage() {
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [sort, setSort] = useState<FeedSort>("latest");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeed = async () => {
      setIsLoading(true);
      setError(null);
      try {
        setPosts(await getCommunityFeed(sort));
      } catch {
        setError("Could not load the community feed.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadFeed();
  }, [sort]);

  const handleLike = async (postId: number) => {
    try {
      await likePost(postId);
      setPosts(await getCommunityFeed(sort));
    } catch {
      setError("Please sign in before liking posts.");
    }
  };

  const handleSave = async (postId: number) => {
    try {
      await savePost(postId);
      setPosts(await getCommunityFeed(sort));
    } catch {
      setError("Please sign in before saving posts.");
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge>Community feed</Badge>
          <h1 className="mt-4 text-4xl font-semibold">Real trips, local tips, fresh ideas</h1>
        </div>
        <Link to="/community/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create post
          </Button>
        </Link>
      </div>
      <div className="mt-6 flex gap-2">
        <Button onClick={() => setSort("latest")} variant={sort === "latest" ? "secondary" : "outline"}>Latest</Button>
        <Button onClick={() => setSort("popular")} variant={sort === "popular" ? "secondary" : "outline"}>Popular</Button>
      </div>

      {isLoading && <Card className="mt-8 h-96 animate-pulse bg-muted/50" />}
      {error && <div className="mt-8 rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">{error}</div>}
      {!isLoading && !error && posts.length === 0 && (
        <div className="mt-8 rounded-lg border bg-muted/40 p-8 text-center text-muted-foreground">No review posts yet.</div>
      )}
      {!isLoading && !error && posts.length > 0 && (
        <div className="mt-8 grid gap-5">
          {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <img alt={post.title} className="h-72 w-full object-cover" src={post.images[0] ?? post.place.images[0] ?? "https://placehold.co/1200x800?text=QuangBinhGo"} />
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">{post.author.full_name} - {post.place.name} - {new Date(post.created_at).toLocaleDateString()}</p>
              <h2 className="mt-2 text-2xl font-semibold">{post.title}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">{post.content}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <button className="flex items-center gap-1.5" onClick={() => void handleLike(post.id)}><Heart className="h-4 w-4" />{post.likes_count}</button>
                <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" />{post.comments_count}</span>
                <button className="flex items-center gap-1.5" onClick={() => void handleSave(post.id)}><Bookmark className="h-4 w-4" />{post.saves_count}</button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}
    </section>
  );
}
