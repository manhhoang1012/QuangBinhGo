import { useEffect, useState } from "react";
import { Bookmark, Heart, MapPin, PenLine } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type ReviewPost, type User } from "@/services/api";
import { getCurrentProfile } from "@/services/userApi";
import { getCommunityFeed, getSavedPostIds } from "@/services/postApi";

export function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    void getCurrentProfile().then(setUser);
    void getCommunityFeed("latest").then((feed) => setPosts(feed.slice(0, 2))).catch(() => setPosts([]));
    setSavedCount(getSavedPostIds().length);
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-lg border bg-muted/40 p-6 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
            {user?.full_name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() ?? "QB"}
          </div>
          <div>
            <h1 className="text-3xl font-semibold">{user?.full_name ?? "Guest traveler"}</h1>
            <p className="mt-1 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {user?.email ?? "Sign in to sync your profile"}
            </p>
          </div>
        </div>
        <Button className="mt-5 gap-2 sm:mt-0" variant="outline">
          <PenLine className="h-4 w-4" />
          Edit profile
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-5"><p className="text-2xl font-semibold">-</p><p className="text-sm text-muted-foreground">My posts</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-2xl font-semibold">-</p><p className="text-sm text-muted-foreground">Likes received</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-2xl font-semibold">{savedCount}</p><p className="text-sm text-muted-foreground">Saved posts</p></CardContent></Card>
      </div>

      <h2 className="mt-10 text-2xl font-semibold">Recent activity</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {posts.slice(0, 2).map((post) => (
          <Card key={post.id}>
            <CardContent className="pt-5">
              <Badge>{post.place.name}</Badge>
              <h3 className="mt-3 font-semibold">{post.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.content}</p>
              <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Heart className="h-4 w-4" />{post.likes_count}</span>
                <span className="flex items-center gap-1"><Bookmark className="h-4 w-4" />{post.saves_count}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
