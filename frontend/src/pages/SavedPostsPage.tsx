import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { type ReviewPost } from "@/services/api";
import { getMySavedPosts } from "@/services/userApi";

export function SavedPostsPage() {
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSaved = async () => {
      setError(null);
      setPosts(await getMySavedPosts());
      setIsLoading(false);
    };

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
      {!isLoading && posts.length === 0 && (
        <div className="mt-8 rounded-lg border bg-muted/40 p-8 text-center text-muted-foreground">
          No saved posts yet.
        </div>
      )}
      <div className="mt-8 grid gap-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="pt-5">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <AuthorLink user={post.author} />
                <span>-</span>
                <span>{post.place.name}</span>
              </div>
              <h2 className="mt-2 text-xl font-semibold">{post.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{post.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function AuthorLink({ user }: { user: { avatar_url?: string | null; full_name: string; username?: string | null } }) {
  const content = (
    <>
      <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground transition-transform group-hover:scale-105">
        {user.avatar_url ? <img alt={user.full_name} className="h-full w-full object-cover" src={user.avatar_url} /> : user.full_name.slice(0, 2).toUpperCase()}
      </span>
      <span className="font-medium text-foreground">{user.full_name}</span>
    </>
  );

  if (!user.username) {
    return <span className="inline-flex items-center gap-2">{content}</span>;
  }

  return (
    <Link className="group inline-flex cursor-pointer items-center gap-2 hover:text-primary hover:underline" to={`/u/${user.username}`}>
      {content}
    </Link>
  );
}
