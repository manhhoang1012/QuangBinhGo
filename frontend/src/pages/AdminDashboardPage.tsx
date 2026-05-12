import { BarChart3, MapPinned, MessageSquare, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { places, posts } from "@/lib/mockData";

const metrics = [
  { label: "Total places", value: "128", icon: MapPinned },
  { label: "Review posts", value: "2.4k", icon: MessageSquare },
  { label: "Users", value: "18k", icon: Users },
  { label: "Engagement", value: "74%", icon: BarChart3 },
];

export function AdminDashboardPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge>Admin</Badge>
          <h1 className="mt-4 text-4xl font-semibold">Dashboard</h1>
          <p className="mt-3 text-muted-foreground">Manage tourism content, community quality, and destination data.</p>
        </div>
        <Button>Add place</Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Places queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {places.slice(0, 3).map((place) => (
              <div className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0" key={place.id}>
                <div>
                  <p className="font-medium">{place.name}</p>
                  <p className="text-sm text-muted-foreground">{place.category} - {place.address}</p>
                </div>
                <Button variant="outline">Edit</Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Community moderation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {posts.map((post) => (
              <div className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0" key={post.id}>
                <div>
                  <p className="font-medium">{post.title}</p>
                  <p className="text-sm text-muted-foreground">{post.likes} likes - {post.comments} comments</p>
                </div>
                <Button variant="outline">Review</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
