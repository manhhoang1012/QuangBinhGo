import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { getMyReviews } from "@/services/userApi";

export function MyReviewsPage() {
  const [reviews, setReviews] = useState<Array<{ id: number; rating: number; content: string; place: { name: string } }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void getMyReviews().then(setReviews).finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-4xl font-semibold">My reviews</h1>
      {isLoading && <Card className="mt-8 h-48 animate-pulse bg-muted/50" />}
      {!isLoading && reviews.length === 0 && <div className="mt-8 rounded-lg border bg-muted/40 p-8 text-center text-muted-foreground">No place reviews yet.</div>}
      <div className="mt-8 grid gap-4">{reviews.map((review) => <Card key={review.id}><CardContent className="pt-5"><p className="text-sm text-muted-foreground">{review.rating}/5</p><h2 className="mt-2 text-xl font-semibold">{review.place.name}</h2><p className="mt-2 text-sm text-muted-foreground">{review.content}</p></CardContent></Card>)}</div>
    </section>
  );
}
