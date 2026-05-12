import { Bookmark, Heart, MessageCircle, Plus } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { posts } from "@/lib/mockData";

export function CommunityFeedPage() {
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
        <Button variant="secondary">Latest</Button>
        <Button variant="outline">Popular</Button>
      </div>

      <div className="mt-8 grid gap-5">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <img alt={post.title} className="h-72 w-full object-cover" src={post.image} />
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">{post.author} - {post.place} - {post.time}</p>
              <h2 className="mt-2 text-2xl font-semibold">{post.title}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">{post.content}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Heart className="h-4 w-4" />{post.likes}</span>
                <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" />{post.comments}</span>
                <span className="flex items-center gap-1.5"><Bookmark className="h-4 w-4" />{post.saves}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
