import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateAiItinerary, saveAiItinerary, type AiItinerary } from "@/services/itineraryApi";

const interestOptions = ["hang động", "biển", "ăn uống", "nghỉ dưỡng", "lịch sử", "thiên nhiên", "check-in", "gia đình", "phượt"];
const styleOptions = ["tiết kiệm", "gia đình", "nghỉ dưỡng", "khám phá", "check-in"];

export function AiItineraryPage() {
  const navigate = useNavigate();
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState("3000000");
  const [peopleCount, setPeopleCount] = useState(2);
  const [interests, setInterests] = useState<string[]>(["hang động", "biển", "ăn uống"]);
  const [travelStyle, setTravelStyle] = useState("khám phá");
  const [startLocation, setStartLocation] = useState("Đồng Hới");
  const [startDate, setStartDate] = useState("");
  const [itinerary, setItinerary] = useState<AiItinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      setItinerary(await generateAiItinerary({
        days,
        budget: budget ? Number(budget) : undefined,
        people_count: peopleCount,
        interests,
        travel_style: travelStyle,
        start_location: startLocation,
        start_date: startDate || undefined,
      }));
    } catch {
      setError("Không thể tạo lịch trình AI. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!itinerary) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await saveAiItinerary(itinerary);
      navigate(`/itineraries/${saved.id}`);
    } catch {
      setError("Không thể lưu lịch trình. Vui lòng đăng nhập và thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (value: string) => {
    setInterests((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const updateTitle = (title: string) => setItinerary((current) => current ? { ...current, title } : current);
  const updateDescription = (description: string) => setItinerary((current) => current ? { ...current, description } : current);
  const updateAiItem = (dayIndex: number, itemIndex: number, patch: Partial<AiItinerary["days"][number]["items"][number]>) => {
    setItinerary((current) => {
      if (!current) return current;
      return {
        ...current,
        days: current.days.map((day, dIndex) => dIndex === dayIndex
          ? { ...day, items: day.items.map((item, iIndex) => iIndex === itemIndex ? { ...item, ...patch } : item) }
          : day),
      };
    });
  };
  const removeAiItem = (dayIndex: number, itemIndex: number) => {
    setItinerary((current) => current ? {
      ...current,
      days: current.days.map((day, dIndex) => dIndex === dayIndex ? { ...day, items: day.items.filter((_, iIndex) => iIndex !== itemIndex) } : day),
    } : current);
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-primary"><Sparkles className="h-4 w-4" /> Gemini powered</p>
          <h1 className="mt-3 text-4xl font-semibold">Tạo lịch trình bằng AI</h1>
          <p className="mt-2 text-sm text-muted-foreground">Tạo bản nháp theo ngày, ngân sách, sở thích và chỉnh sửa trước khi lưu.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/itineraries")}>Lịch trình của tôi</Button>
      </div>

      <Card className="mt-6">
        <CardContent className="grid gap-4 pt-5">
          <div className="grid gap-3 md:grid-cols-5">
            <Input aria-label="Số ngày" min={1} max={14} onChange={(event) => setDays(Number(event.target.value))} type="number" value={days} />
            <Input aria-label="Ngân sách" onChange={(event) => setBudget(event.target.value)} value={budget} />
            <Input aria-label="Số người" min={1} onChange={(event) => setPeopleCount(Number(event.target.value))} type="number" value={peopleCount} />
            <Input aria-label="Điểm bắt đầu" onChange={(event) => setStartLocation(event.target.value)} value={startLocation} />
            <Input aria-label="Ngày bắt đầu" onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} />
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((option) => (
                <button className={`rounded-md border px-3 py-2 text-sm ${interests.includes(option) ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`} key={option} onClick={() => toggleInterest(option)} type="button">
                  {option}
                </button>
              ))}
            </div>
            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={travelStyle} onChange={(event) => setTravelStyle(event.target.value)}>
              {styleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <Button className="w-fit gap-2" onClick={() => void handleGenerate()} disabled={loading || interests.length === 0}>
            <CalendarDays className="h-4 w-4" />
            {loading ? "Đang tạo..." : "Tạo lịch trình bằng AI"}
          </Button>
        </CardContent>
      </Card>

      {error && <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      {!loading && !itinerary && !error && <div className="mt-8 rounded-md border p-8 text-center text-muted-foreground">Chọn nhu cầu chuyến đi và để Gemini tạo lịch trình đầu tiên.</div>}

      {itinerary && (
        <div className="mt-8 grid gap-5">
          <Card>
            <CardContent className="grid gap-3 pt-5">
              <Input value={itinerary.title} onChange={(event) => updateTitle(event.target.value)} />
              <Textarea value={itinerary.description} onChange={(event) => updateDescription(event.target.value)} />
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>{itinerary.total_days} ngày</span>
                <span>·</span>
                <span>{itinerary.estimated_budget ? itinerary.estimated_budget.toLocaleString("vi-VN") + "đ" : "Chưa có ngân sách"}</span>
                <span>·</span>
                <span>{itinerary.travel_style}</span>
              </div>
            </CardContent>
          </Card>
          {itinerary.days.map((day, dayIndex) => (
            <Card key={day.day_number}>
              <CardContent className="pt-5">
                <h2 className="text-xl font-semibold">Day {day.day_number}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{day.summary}</p>
                <div className="mt-4 grid gap-3">
                  {day.items.map((item, itemIndex) => (
                    <div className="grid gap-2 rounded-md border p-3 md:grid-cols-[120px_1fr_auto]" key={`${day.day_number}-${itemIndex}`}>
                      <Input type="time" value={item.time} onChange={(event) => updateAiItem(dayIndex, itemIndex, { time: event.target.value })} />
                      <div className="grid gap-2">
                        <Input value={item.title} onChange={(event) => updateAiItem(dayIndex, itemIndex, { title: event.target.value })} />
                        <Textarea value={item.note} onChange={(event) => updateAiItem(dayIndex, itemIndex, { note: event.target.value })} />
                        <div className="grid gap-2 md:grid-cols-2">
                          <Input value={item.transport_note ?? ""} placeholder="Thời gian di chuyển / phương tiện" onChange={(event) => updateAiItem(dayIndex, itemIndex, { transport_note: event.target.value })} />
                          <Input value={item.estimated_cost ?? ""} placeholder="Chi phí dự kiến" onChange={(event) => updateAiItem(dayIndex, itemIndex, { estimated_cost: event.target.value ? Number(event.target.value) : null })} />
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => removeAiItem(dayIndex, itemIndex)}>Xóa</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void handleSave()} disabled={saving}>{saving ? "Đang lưu..." : "Lưu lịch trình"}</Button>
            <Button variant="outline" onClick={() => void handleGenerate()} disabled={loading}>Tạo lại</Button>
            <Button variant="outline" onClick={() => navigate("/itineraries/new")}>Chỉnh sửa</Button>
          </div>
        </div>
      )}
    </section>
  );
}
