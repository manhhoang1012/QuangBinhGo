import { useEffect, useState } from "react";
import { MapPin, Search, Star } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type Place } from "@/services/api";
import { getPlaces } from "@/services/placeApi";

const categories = ["All", "cave", "beach", "nature", "historical", "food", "cultural", "resort"];
const imageFallback = "https://placehold.co/1200x800?text=QuangBinhGo";

export function PlacesListPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlaces = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getPlaces({
          category: selectedCategory === "All" ? undefined : selectedCategory,
          search: search.trim() || undefined,
        });
        setPlaces(data);
      } catch {
        setError("Could not load places. Check that the FastAPI backend is running.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadPlaces();
  }, [selectedCategory, search]);

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
            <Input
              className="pl-9"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by place name"
              value={search}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                className={`rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted ${
                  selectedCategory === category ? "bg-primary text-primary-foreground" : "bg-background"
                }`}
                key={category}
                onClick={() => setSelectedCategory(category)}
              >
                {category === "All" ? "All" : category[0].toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card className="h-96 animate-pulse bg-muted/50" key={index} />
          ))}
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          {error}
        </div>
      )}

      {!isLoading && !error && places.length === 0 && (
        <div className="mt-8 rounded-lg border bg-muted/40 p-8 text-center text-muted-foreground">
          No places found for this filter.
        </div>
      )}

      {!isLoading && !error && places.length > 0 && (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {places.map((place) => (
            <Link key={place.id} to={`/places/${place.id}`}>
              <Card className="h-full overflow-hidden transition-transform hover:-translate-y-1">
                <img alt={place.name} className="h-56 w-full object-cover" src={place.images[0] ?? imageFallback} />
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <Badge>{place.category}</Badge>
                    <span className="flex items-center gap-1 text-sm font-medium">
                      <Star className="h-4 w-4 fill-secondary text-secondary" />
                      {Number(place.rating_avg).toFixed(1)}
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
      )}
    </section>
  );
}
