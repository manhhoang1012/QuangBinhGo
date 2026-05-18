import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  deleteItinerary,
  getItineraries,
  shareItinerary,
  type Itinerary,
} from "@/services/itineraryApi";

export function ItinerariesPage() {
  const [items, setItems] = useState<Itinerary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setItems(await getItineraries());
    } catch {
      setError("Không thể tải lịch trình. Vui lòng đăng nhập.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const remove = async (id: number) => {
    if (!window.confirm("Xóa lịch trình này?")) return;
    await deleteItinerary(id);
    await load();
  };

  const share = async (id: number) => {
    const itinerary = await shareItinerary(id);
    if (itinerary.share_slug) {
      await navigator.clipboard.writeText(`${window.location.origin}/itineraries/shared/${itinerary.share_slug}`);
    }
    await load();
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-semibold">Lịch trình của tôi</h1>
        <Link to="/itineraries/new"><Button>Tạo lịch trình</Button></Link>
      </div>

      {isLoading && <Card className="mt-8 h-40 animate-pulse bg-muted/50" />}
      {error && <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      {!isLoading && !error && items.length === 0 && (
        <div className="mt-8 rounded-md border p-8 text-center text-muted-foreground">Chưa có lịch trình nào.</div>
      )}

      <div className="mt-8 grid gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5">
              <div>
                <p className="text-sm text-muted-foreground">
                  {item.total_days} ngày · {labelVisibility(item.visibility)} · {item.created_by_ai ? "AI tạo" : "Tự tạo"}
                </p>
                <Link to={`/itineraries/${item.id}`}>
                  <h2 className="mt-1 text-xl font-semibold hover:text-primary">{item.title}</h2>
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cập nhật {new Date(item.updated_at).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/itineraries/${item.id}/edit`}><Button variant="outline">Sửa</Button></Link>
                <Button variant="outline" onClick={() => void share(item.id)}>Chia sẻ</Button>
                <Button variant="outline" onClick={() => void remove(item.id)}>Xóa</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function labelVisibility(value: Itinerary["visibility"]) {
  if (value === "public") return "Công khai";
  if (value === "shared") return "Chia sẻ bằng link";
  return "Riêng tư";
}
