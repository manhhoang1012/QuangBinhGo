import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteItinerary, getItinerary, getSharedItinerary, shareItinerary, type Itinerary } from "@/services/itineraryApi";

export function ItineraryDetailPage({ shared = false }: { shared?: boolean }) {
  const params = useParams();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setItinerary(shared ? await getSharedItinerary(params.shareSlug ?? "") : await getItinerary(Number(params.id)));
      } catch {
        setError("Không thể tải lịch trình.");
      }
    };
    void load();
  }, [params.id, params.shareSlug, shared]);

  if (error) return <section className="mx-auto max-w-5xl px-4 py-10 text-destructive">{error}</section>;
  if (!itinerary) return <section className="mx-auto max-w-5xl px-4 py-10 text-muted-foreground">Đang tải...</section>;

  const days = Array.from({ length: itinerary.total_days }, (_, index) => index + 1);
  const totalCost = itinerary.items.reduce((sum, item) => sum + Number(item.estimated_cost || 0), 0);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{itinerary.visibility} · {itinerary.created_by_ai ? "AI tạo" : "Tự tạo"} · {totalCost.toLocaleString()} VND dự kiến</p>
          <h1 className="mt-2 text-4xl font-semibold">{itinerary.title}</h1>
          {itinerary.description && <p className="mt-3 text-muted-foreground">{itinerary.description}</p>}
        </div>
        {!shared && <div className="flex gap-2"><Link to={`/itineraries/${itinerary.id}/edit`}><Button>Sửa</Button></Link><Button variant="outline" onClick={() => void shareItinerary(itinerary.id).then((item) => item.share_slug && navigator.clipboard.writeText(`${window.location.origin}/itineraries/shared/${item.share_slug}`))}>Copy link</Button><Button variant="outline" onClick={() => { if (window.confirm("Xóa lịch trình?")) void deleteItinerary(itinerary.id).then(() => navigate("/itineraries")); }}>Xóa</Button></div>}
      </div>
      <div className="mt-8 grid gap-6">
        {days.map((day) => (
          <Card key={day}>
            <CardContent className="pt-5">
              <h2 className="text-2xl font-semibold">Day {day}</h2>
              <div className="mt-4 space-y-4">
                {itinerary.items.filter((item) => item.day_number === day).sort((a, b) => a.order_index - b.order_index).map((item) => (
                  <div className="border-l-2 border-primary pl-4" key={item.id}>
                    <p className="text-sm font-medium">{item.start_time?.slice(0, 5) || "--:--"} {item.title}</p>
                    {item.place && <Link className="text-sm text-primary hover:underline" to={`/places/${item.place.slug || item.place.id}`}>{item.place.name}</Link>}
                    {item.note && <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>}
                    {item.transport_note && <p className="mt-1 text-xs text-muted-foreground">Di chuyển: {item.transport_note}</p>}
                  </div>
                ))}
                {itinerary.items.filter((item) => item.day_number === day).length === 0 && <p className="text-sm text-muted-foreground">Chưa có hoạt động.</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
