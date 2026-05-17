import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { type AdminReview, deleteReview, getAdminReviews, updatePlaceReviewStatus } from "@/services/adminApi";

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setReviews(await getAdminReviews());
    } catch {
      setError("Could not load reviews.");
    } finally {
      setIsLoading(false);
    }
  };

  const hide = async (review: AdminReview) => {
    try {
      await updatePlaceReviewStatus(review.id, review.status === "hidden" ? "visible" : "hidden");
      setNotice("Review status updated.");
      await load();
    } catch {
      setError("Could not update review.");
    }
  };

  const filtered = statusFilter ? reviews.filter((review) => review.status === statusFilter) : reviews;

  useEffect(() => { void load(); }, []);

  const remove = async (review: AdminReview) => {
    if (!window.confirm(`Delete ${review.rating}-star review for ${review.place.name}?`)) return;
    try {
      await deleteReview(review.id);
      setNotice("Review deleted.");
      await load();
    } catch {
      setError("Could not delete review.");
    }
  };

  return (
    <section>
      <AdminPageHeader description="Moderate place ratings and reviews." title="Reviews" />
      {notice && <div className="mt-6 rounded-lg border bg-accent/10 p-4 text-sm text-accent">{notice}</div>}
      {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      <div className="mt-6">
        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All</option>
          <option value="visible">Visible</option>
          <option value="reported">Reported</option>
          <option value="hidden">Hidden</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>
      {isLoading && <Card className="mt-6 h-48 animate-pulse bg-muted/60" />}
      {!isLoading && filtered.length === 0 && <div className="mt-6 rounded-lg border bg-background p-8 text-center text-muted-foreground">No reviews found.</div>}
      <div className="mt-6 grid gap-4">
        {filtered.map((review) => (
          <Card key={review.id}>
            <CardContent className="grid gap-4 pt-5 lg:grid-cols-[1fr_140px] lg:items-center">
              <div>
                <p className="font-medium">{review.place.name} - {review.rating}/5</p>
                <p className="text-sm text-muted-foreground">{review.author.full_name} - {review.status} - {review.report_count} reports</p>
                <p className="mt-1">{review.content}</p>
                {review.reports?.map((report) => <p className="mt-1 text-xs text-muted-foreground" key={report.id}>{report.reason}: {report.detail || "No detail"}</p>)}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => void hide(review)} variant="outline">{review.status === "hidden" ? "Show" : "Hide"}</Button>
                <Button onClick={() => void remove(review)} variant="outline">Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
