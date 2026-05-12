import { MapPin, Search, Star } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { places } from "@/lib/mockData";

const categories = ["All", "Cave", "Beach", "Nature", "Landscape"];

export function PlacesListPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Badge>Explore Quang Binh</Badge>
          <h1 className="mt-4 text-4xl font-semibold">Places worth building a trip around</h1>
          <p className="mt-4 text-muted-foreground">
            Browse caves, beaches, springs, dunes, and city stops with ratings from the travel community.
          </p>
        </div>
        <div className="rounded-lg border bg-muted/40 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by place name" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                className="rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                key={category}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {places.map((place) => (
          <Link key={place.id} to={`/places/${place.id}`}>
            <Card className="h-full overflow-hidden transition-transform hover:-translate-y-1">
              <img alt={place.name} className="h-56 w-full object-cover" src={place.image} />
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <Badge>{place.category}</Badge>
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Star className="h-4 w-4 fill-secondary text-secondary" />
                    {place.rating}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-semibold">{place.name}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{place.description}</p>
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {place.address}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
