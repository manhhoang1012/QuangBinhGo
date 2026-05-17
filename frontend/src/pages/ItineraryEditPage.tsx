import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Place } from "@/services/api";
import { createItinerary, getItinerary, updateItinerary, type Itinerary, type ItineraryItem } from "@/services/itineraryApi";
import { getPlaces } from "@/services/placeApi";

export function ItineraryEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [places, setPlaces] = useState<Place[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalDays, setTotalDays] = useState(2);
  const [budget, setBudget] = useState("");
  const [travelStyle, setTravelStyle] = useState("khám phá");
  const [interests, setInterests] = useState("hang động, biển");
  const [visibility, setVisibility] = useState<"private" | "public" | "shared">("private");
  const [items, setItems] = useState<Partial<ItineraryItem>[]>([]);
  const isEdit = Boolean(id);

  useEffect(() => {
    void getPlaces({ limit: 100 }).then(setPlaces);
    if (id) void getItinerary(Number(id)).then(fill);
  }, [id]);

  const fill = (itinerary: Itinerary) => {
    setTitle(itinerary.title);
    setDescription(itinerary.description ?? "");
    setTotalDays(itinerary.total_days);
    setBudget(String(itinerary.budget ?? ""));
    setTravelStyle(itinerary.travel_style ?? "");
    setInterests(itinerary.interests.join(", "));
    setVisibility(itinerary.visibility);
    setItems(itinerary.items);
  };

  const save = async () => {
    const payload = {
      title,
      description,
      total_days: totalDays,
      budget: budget ? Number(budget) : undefined,
      travel_style: travelStyle,
      interests: interests.split(",").map((item) => item.trim()).filter(Boolean),
      visibility,
      items: items.map((item, index) => ({ ...item, order_index: item.order_index ?? index, day_number: item.day_number ?? 1, title: item.title || "Hoạt động" })),
    };
    const saved = isEdit ? await updateItinerary(Number(id), payload) : await createItinerary(payload);
    navigate(`/itineraries/${saved.id}`);
  };

  const updateItem = (index: number, patch: Partial<ItineraryItem>) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-4xl font-semibold">{isEdit ? "Sửa lịch trình" : "Tạo lịch trình"}</h1>
      <Card className="mt-6"><CardContent className="grid gap-3 pt-5">
        <Input placeholder="Tiêu đề" value={title} onChange={(event) => setTitle(event.target.value)} />
        <Textarea placeholder="Mô tả" value={description} onChange={(event) => setDescription(event.target.value)} />
        <div className="grid gap-3 sm:grid-cols-3"><Input type="number" value={totalDays} onChange={(event) => setTotalDays(Number(event.target.value))} /><Input placeholder="Ngân sách" value={budget} onChange={(event) => setBudget(event.target.value)} /><Input placeholder="Kiểu du lịch" value={travelStyle} onChange={(event) => setTravelStyle(event.target.value)} /></div>
        <Input placeholder="Sở thích" value={interests} onChange={(event) => setInterests(event.target.value)} />
        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={visibility} onChange={(event) => setVisibility(event.target.value as "private" | "public" | "shared")}><option value="private">Private</option><option value="public">Public</option><option value="shared">Shared</option></select>
      </CardContent></Card>
      <div className="mt-6 flex justify-between"><h2 className="text-2xl font-semibold">Hoạt động</h2><Button onClick={() => setItems((current) => [...current, { day_number: 1, title: "", order_index: current.length }])}>Thêm hoạt động</Button></div>
      <div className="mt-4 grid gap-3">
        {items.map((item, index) => (
          <Card key={index}><CardContent className="grid gap-2 pt-4 md:grid-cols-6">
            <Input type="number" value={item.day_number ?? 1} onChange={(event) => updateItem(index, { day_number: Number(event.target.value) })} />
            <Input type="time" value={item.start_time ?? ""} onChange={(event) => updateItem(index, { start_time: event.target.value })} />
            <Input className="md:col-span-2" placeholder="Tiêu đề" value={item.title ?? ""} onChange={(event) => updateItem(index, { title: event.target.value })} />
            <select className="rounded-md border bg-background px-3 py-2 text-sm" value={item.place_id ?? ""} onChange={(event) => updateItem(index, { place_id: event.target.value ? Number(event.target.value) : null })}><option value="">Custom</option>{places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select>
            <Button variant="outline" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Xóa</Button>
            <Textarea className="md:col-span-6" placeholder="Ghi chú" value={item.note ?? ""} onChange={(event) => updateItem(index, { note: event.target.value })} />
          </CardContent></Card>
        ))}
      </div>
      <Button className="mt-6" onClick={() => void save()}>Lưu lịch trình</Button>
    </section>
  );
}
