import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { type ReviewPost, type User } from "@/services/api";
import { getPublicProfile, getUserPosts } from "@/services/userApi";

export function PublicProfilePage() {
  const { username = "" } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [profile, userPosts] = await Promise.all([getPublicProfile(username), getUserPosts(username)]);
        setUser(profile);
        setPosts(userPosts);
      } catch {
        setError("Could not load public profile.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [username]);

  if (isLoading) return <section className="mx-auto max-w-5xl px-4 py-10 text-muted-foreground">Loading profile...</section>;
  if (error || !user) return <section className="mx-auto max-w-5xl px-4 py-10 text-destructive">{error ?? "Profile not found."}</section>;

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="overflow-hidden rounded-lg border bg-muted/40">
        <div className="h-44 bg-primary/15">{user.cover_image_url && <img alt="Cover" className="h-full w-full object-cover" src={user.cover_image_url} />}</div>
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end gap-4">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-primary text-2xl font-semibold text-primary-foreground">
              {user.avatar_url ? <img alt={user.full_name} className="h-full w-full object-cover" src={user.avatar_url} /> : user.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-semibold">{user.full_name}</h1>
              <p className="text-muted-foreground">@{user.username}</p>
              <Badge>{user.role}</Badge>
            </div>
          </div>
          {user.bio && <p className="mt-4 max-w-2xl text-muted-foreground">{user.bio}</p>}
        </div>
      </div>
      <h2 className="mt-8 text-2xl font-semibold">Posts</h2>
      <div className="mt-4 grid gap-4">
        {posts.length === 0 && <Card><CardContent className="pt-5 text-sm text-muted-foreground">No public posts yet.</CardContent></Card>}
        {posts.map((post) => <Card key={post.id}><CardContent className="pt-5"><p className="text-sm text-muted-foreground">{post.place.name}</p><h3 className="mt-2 font-semibold">{post.title}</h3><p className="mt-2 text-sm text-muted-foreground">{post.content}</p></CardContent></Card>)}
      </div>
    </section>
  );
}
