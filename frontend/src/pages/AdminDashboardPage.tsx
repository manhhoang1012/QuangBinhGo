import { useEffect, useMemo, useState } from "react";
import { MapPinned, MessageSquare, Star, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { type Place, type ReviewPost, type User } from "@/services/api";
import { getAdminOverview } from "@/services/adminApi";

export function AdminDashboardPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOverview = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const overview = await getAdminOverview();
        setPlaces(overview.places);
        setPosts(overview.posts);
        setUsers(overview.users);
      } catch {
        setError("Could not load admin overview.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadOverview();
  }, []);

  const commentCount = useMemo(() => posts.reduce((total, post) => total + post.comments_count, 0), [posts]);

  const metrics = [
    { label: "Users", value: users.length, icon: Users },
    { label: "Places", value: places.length, icon: MapPinned },
    { label: "Social posts", value: posts.length, icon: MessageSquare },
    { label: "Comments", value: commentCount, icon: MessageSquare },
    { label: "Reviews", value: "Pending API", icon: Star },
  ];

  return (
    <section>
      <AdminPageHeader
        description="Monitor core QuangBinhGo content and community activity."
        title="Dashboard"
      />

      {error && <AlertMessage tone="error" text={error} />}
      {isLoading && <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{metrics.map((metric) => <Card className="h-32 animate-pulse bg-muted/60" key={metric.label} />)}</div>}

      {!isLoading && !error && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.label}>
                  <CardContent className="pt-5">
                    <Icon className="h-5 w-5 text-primary" />
                    <p className="mt-4 text-3xl font-semibold">{metric.value}</p>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Recent posts</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {posts.length === 0 && <p className="text-sm text-muted-foreground">No social posts yet.</p>}
                {posts.slice(0, 5).map((post) => (
                  <div className="border-b pb-3 last:border-b-0 last:pb-0" key={post.id}>
                    <p className="font-medium">{post.title}</p>
                    <p className="text-sm text-muted-foreground">{post.author.full_name} - {post.place.name} - {post.likes_count} likes - {post.comments_count} comments</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Newest places</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {places.length === 0 && <p className="text-sm text-muted-foreground">No places yet.</p>}
                {places.slice(0, 5).map((place) => (
                  <div className="border-b pb-3 last:border-b-0 last:pb-0" key={place.id}>
                    <p className="font-medium">{place.name}</p>
                    <p className="text-sm text-muted-foreground">{place.category} - {place.address}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </section>
  );
}

function AlertMessage({ text, tone }: { text: string; tone: "error" | "success" }) {
  return (
    <div className={`mt-6 rounded-lg border p-4 text-sm ${tone === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
      {text}
    </div>
  );
}
