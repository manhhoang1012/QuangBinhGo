import { useEffect, useState } from "react";
import { CalendarDays, Compass, Heart, MapPin, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceImageGallery } from "@/components/places/PlaceImageGallery";
import { type Place, type ReviewPost } from "@/services/api";
import { getPlace } from "@/services/placeApi";
import { getCommunityFeed } from "@/services/postApi";

export function PlaceDetailPage() {
  const { placeId } = useParams();
  const [place, setPlace] = useState<Place | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<ReviewPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlace = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const placeData = await getPlace(Number(placeId));
        setPlace(placeData);
        const feed = await getCommunityFeed("latest");
        setRelatedPosts(feed.filter((post) => post.place_id === placeData.id));
      } catch {
        setError("Could not load this place.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadPlace();
  }, [placeId]);

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-muted-foreground">Loading place...</div>;
  }

  if (error || !place) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-destructive">{error ?? "Place not found."}</div>;
  }

  return (
    <section>
      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Badge>{place.category}</Badge>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-5xl">{place.name}</h1>
          <p className="mt-4 flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5" />
            {place.address}
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div>
          <PlaceImageGallery images={place.images ?? []} placeName={place.name} />

          <div className="mt-8 flex flex-wrap gap-3">
            <Badge className="bg-secondary text-secondary-foreground">
              <Star className="mr-1 h-3.5 w-3.5 fill-current" />
              {Number(place.rating_avg).toFixed(1)} rating
            </Badge>
            <Badge>Best for half-day trips</Badge>
          </div>
          <h2 className="mt-6 text-2xl font-semibold">Overview</h2>
          <p className="mt-3 max-w-3xl leading-8 text-muted-foreground">{place.description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center gap-3 pt-5">
                <Compass className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Latitude</p>
                  <p className="font-medium">{Number(place.latitude).toFixed(6)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-5">
                <Compass className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Longitude</p>
                  <p className="font-medium">{Number(place.longitude).toFixed(6)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2 className="mt-10 text-2xl font-semibold">Traveler notes</h2>
          <div className="mt-4 grid gap-4">
            {relatedPosts.length === 0 && (
              <Card>
                <CardContent className="pt-5 text-sm text-muted-foreground">No traveler notes for this place yet.</CardContent>
              </Card>
            )}
            {relatedPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="pt-5">
                  <p className="text-sm text-muted-foreground">{post.author.full_name} - {new Date(post.created_at).toLocaleDateString()}</p>
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
