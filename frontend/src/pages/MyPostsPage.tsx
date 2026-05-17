import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { type ReviewPost } from "@/services/api";
import { getMyPosts } from "@/services/userApi";

export function MyPostsPage() {
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void getMyPosts().then(setPosts).finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-4xl font-semibold">My posts</h1>
      {isLoading && <Card className="mt-8 h-48 animate-pulse bg-muted/50" />}
      {!isLoading && posts.length === 0 && <div className="mt-8 rounded-lg border bg-muted/40 p-8 text-center text-muted-foreground">No posts yet.</div>}
      <div className="mt-8 grid gap-4">{posts.map((post) => <Card key={post.id}><CardContent className="pt-5"><p className="text-sm text-muted-foreground">{post.place?.name ?? "No place"}</p><h2 className="mt-2 text-xl font-semibold">{post.title}</h2><p className="mt-2 text-sm text-muted-foreground">{post.content}</p></CardContent></Card>)}</div>
    </section>
  );
}
