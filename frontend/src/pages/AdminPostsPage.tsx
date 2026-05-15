import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { type ReviewPost } from "@/services/api";
import { getCommunityFeed } from "@/services/postApi";

export function AdminPostsPage() {
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [query, setQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<ReviewPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        setPosts(await getCommunityFeed("latest"));
      } catch {
        setError("Could not load social posts.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadPosts();
  }, []);

  const filteredPosts = posts.filter((post) => `${post.title} ${post.content} ${post.author.full_name}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <section>
      <AdminPageHeader description="Review community posts. Hide/delete moderation endpoints are pending backend support." title="Social posts" />
      {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      <div className="mt-6">
        <Input onChange={(event) => setQuery(event.target.value)} placeholder="Search posts by title, content, or author" value={query} />
      </div>
      {isLoading && <Card className="mt-6 h-48 animate-pulse bg-muted/60" />}
      {!isLoading && filteredPosts.length === 0 && <div className="mt-6 rounded-lg border bg-background p-8 text-center text-muted-foreground">No posts found.</div>}
      <div className="mt-6 grid gap-4">
        {filteredPosts.map((post) => (
          <Card key={post.id}>
            <CardContent className="grid gap-4 pt-5 lg:grid-cols-[96px_1fr_160px] lg:items-center">
              <img alt={post.title} className="h-24 w-24 rounded-md object-cover" src={post.images[0] ?? post.place.images[0] ?? "https://placehold.co/400x400?text=QuangBinhGo"} />
              <div>
                <p className="font-medium">{post.title}</p>
                <p className="text-sm text-muted-foreground">{post.author.full_name} - {post.place.name} - {post.likes_count} likes - {post.comments_count} comments</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.content}</p>
              </div>
              <Button onClick={() => setSelectedPost(post)} variant="outline">View</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4">
          <Card className="mx-auto mt-10 max-w-3xl">
            <CardContent className="pt-5">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{selectedPost.author.full_name} - {selectedPost.place.name}</p>
                  <h2 className="mt-2 text-2xl font-semibold">{selectedPost.title}</h2>
                </div>
                <Button onClick={() => setSelectedPost(null)} variant="outline">Close</Button>
              </div>
              <p className="mt-4 leading-7 text-muted-foreground">{selectedPost.content}</p>
              <div className="mt-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                TODO backend: add admin endpoints to hide/show/delete posts.
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
