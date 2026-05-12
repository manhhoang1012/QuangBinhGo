import { CalendarDays, Heart, MapPin, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { places, posts } from "@/lib/mockData";

export function PlaceDetailPage() {
  const { placeId } = useParams();
  const place = places.find((item) => item.id === Number(placeId)) ?? places[0];
  const relatedPosts = posts.filter((post) => post.place === place.name);

  return (
    <section>
      <div className="relative h-[460px] overflow-hidden">
        <img alt={place.name} className="h-full w-full object-cover" src={place.image} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl px-4 py-10 text-white sm:px-6 lg:px-8">
          <Badge className="bg-white/15 text-white backdrop-blur">{place.category}</Badge>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold">{place.name}</h1>
          <p className="mt-4 flex items-center gap-2 text-white/85">
            <MapPin className="h-5 w-5" />
            {place.address}
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div>
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-secondary text-secondary-foreground">
              <Star className="mr-1 h-3.5 w-3.5 fill-current" />
              {place.rating} rating
            </Badge>
            <Badge>Best for half-day trips</Badge>
          </div>
          <h2 className="mt-6 text-2xl font-semibold">Overview</h2>
          <p className="mt-3 max-w-3xl leading-8 text-muted-foreground">{place.description}</p>

          <h2 className="mt-10 text-2xl font-semibold">Traveler notes</h2>
          <div className="mt-4 grid gap-4">
            {(relatedPosts.length ? relatedPosts : posts.slice(0, 2)).map((post) => (
              <Card key={post.id}>
                <CardContent className="pt-5">
                  <p className="text-sm text-muted-foreground">{post.author} - {post.time}</p>
                  <h3 className="mt-2 font-semibold">{post.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{post.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan this stop</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full gap-2">
                <CalendarDays className="h-4 w-4" />
                Add to itinerary
              </Button>
              <Button className="w-full gap-2" variant="outline">
                <Heart className="h-4 w-4" />
                Save place
              </Button>
              <Link to="/community/new">
                <Button className="w-full" variant="secondary">Write review</Button>
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </section>
  );
}
