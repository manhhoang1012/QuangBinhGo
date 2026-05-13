import { useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type AiSearchResult, searchReviewPosts } from "@/services/aiApi";

export function AiSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AiSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchReviewPosts(query, 5);
      setResults(data.results);
    } catch {
      setError("AI search is unavailable. Check Pinecone and sentence-transformer configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold">AI review search</h1>
      <div className="mt-6 flex gap-2">
        <Input onChange={(event) => setQuery(event.target.value)} placeholder="Search for cave trips, beach days, food ideas..." value={query} />
        <Button className="gap-2" disabled={isLoading || !query} onClick={() => void handleSearch()}>
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
      {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">{error}</div>}
      {!isLoading && !error && results.length === 0 && <div className="mt-8 text-muted-foreground">No AI results yet.</div>}
      <div className="mt-8 grid gap-4">
        {results.map((result) => (
          <Card key={result.post.id}>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Score {result.score.toFixed(3)} - {result.post.place.name}</p>
              <h2 className="mt-2 text-xl font-semibold">{result.post.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{result.post.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
