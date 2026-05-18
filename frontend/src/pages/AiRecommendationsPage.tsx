import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPinned, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { aiRecommendPlaces } from "@/services/aiApi";
import { type Place } from "@/services/api";

const interestOptions = ["hang động", "biển", "ăn uống", "nghỉ dưỡng", "lịch sử", "thiên nhiên", "check-in", "gia đình", "phượt"];
const styleOptions = ["tiết kiệm", "gia đình", "nghỉ dưỡng", "khám phá", "check-in"];

export function AiRecommendationsPage() {
  const [interests, setInterests] = useState<string[]>(["hang động", "gia đình"]);
  const [budget, setBudget] = useState("3000000");
  const [days, setDays] = useState(3);
  const [peopleCount, setPeopleCount] = useState(2);
  const [travelStyle, setTravelStyle] = useState("gia đình");
  const [results, setResults] = useState<Array<{ place: Place; reason: string }>>([]);
  const [meta, setMeta] = useState<{ source?: string; budget?: number | null; region?: string | null }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (value: string) => {
    setInterests((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiRecommendPlaces({
        interests,
        budget: budget ? Number(budget) : undefined,
        travel_style: travelStyle,
        days,
      });
      setResults(data.recommended_places);
      setMeta({ source: data.source, budget: data.estimated_budget, region: data.suggested_region });
    } catch {
      setError("Không thể lấy gợi ý AI. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <Badge className="gap-2"><Sparkles className="h-3.5 w-3.5" /> Gemini powered</Badge>
        <h1 className="mt-4 text-4xl font-semibold">Gợi ý địa điểm bằng AI</h1>
        <p className="mt-2 text-sm text-muted-foreground">Chọn nhu cầu chuyến đi, Gemini sẽ chọn địa điểm phù hợp từ dữ liệu QuangBinhGo.</p>
      </div>

      <Card className="mt-6">
        <CardContent className="grid gap-4 pt-5">
          <div className="grid gap-3 md:grid-cols-4">
            <Input aria-label="Ngân sách" value={budget} onChange={(event) => setBudget(event.target.value)} />
            <Input aria-label="Số ngày" min={1} type="number" value={days} onChange={(event) => setDays(Number(event.target.value))} />
            <Input aria-label="Số người" min={1} type="number" value={peopleCount} onChange={(event) => setPeopleCount(Number(event.target.value))} />
            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={travelStyle} onChange={(event) => setTravelStyle(event.target.value)}>
              {styleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((option) => (
              <button
                className={`rounded-md border px-3 py-2 text-sm ${interests.includes(option) ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}
                key={option}
                onClick={() => toggleInterest(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
          <Button className="w-fit gap-2" disabled={loading || interests.length === 0} onClick={() => void submit()}>
            <MapPinned className="h-4 w-4" />
            {loading ? "Đang gợi ý..." : "Gợi ý cho tôi"}
          </Button>
        </CardContent>
      </Card>

      {error && <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      {results.length > 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Nguồn: {meta.source} · Khu vực gợi ý: {meta.region || "linh hoạt"} · Ngân sách: {meta.budget ? meta.budget.toLocaleString("vi-VN") + "đ" : "chưa xác định"}
        </p>
      )}
      {!loading && !error && results.length === 0 && <div className="mt-8 rounded-md border p-8 text-center text-muted-foreground">Chưa có gợi ý. Hãy chọn sở thích và bấm “Gợi ý cho tôi”.</div>}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {results.map(({ place, reason }) => (
          <Card key={place.id}>
            <CardContent className="flex gap-4 pt-5">
              <img alt={place.name} className="h-28 w-36 rounded-md object-cover" src={place.cover_image || place.images?.[0] || "https://placehold.co/400x300?text=QuangBinhGo"} />
              <div>
                <Badge>{place.category}</Badge>
                <Link to={`/places/${place.slug || place.id}`}><h2 className="mt-2 text-lg font-semibold hover:text-primary">{place.name}</h2></Link>
                <p className="mt-2 text-sm text-muted-foreground">{reason}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
