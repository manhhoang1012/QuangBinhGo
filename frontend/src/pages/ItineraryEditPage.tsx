import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Place } from "@/services/api";
import {
  addItineraryItem,
  createItinerary,
  deleteItineraryItem,
  getItinerary,
  updateItinerary,
  updateItineraryItem,
  type Itinerary,
  type ItineraryItem,
} from "@/services/itineraryApi";
import { getPlaces } from "@/services/placeApi";

type Visibility = "private" | "public" | "shared";

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
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [items, setItems] = useState<Partial<ItineraryItem>[]>([]);
  const [deletedItemIds, setDeletedItemIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(id);

  useEffect(() => {
    void getPlaces({ limit: 100 }).then(setPlaces).catch(() => setPlaces([]));
    if (!id) return;
    setLoading(true);
    void getItinerary(Number(id))
      .then(fill)
      .catch(() => setError("Không thể tải lịch trình."))
      .finally(() => setLoading(false));
  }, [id]);

  const fill = (itinerary: Itinerary) => {
    setTitle(itinerary.title);
    setDescription(itinerary.description ?? "");
    setTotalDays(itinerary.total_days);
    setBudget(String(itinerary.budget ?? ""));
    setTravelStyle(itinerary.travel_style ?? "");
    setInterests(itinerary.interests.join(", "));
    setVisibility(itinerary.visibility);
    setItems([...itinerary.items].sort(sortItems));
    setDeletedItemIds([]);
  };

  const normalizedItems = () =>
    [...items].sort(sortItems).map((item, index) => ({
      ...item,
      day_number: item.day_number ?? 1,
      place_id: item.place_id || null,
      title: item.title?.trim() || "Hoạt động",
      order_index: index,
    }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title,
        description,
        total_days: totalDays,
        budget: budget ? Number(budget) : undefined,
        travel_style: travelStyle,
        interests: interests.split(",").map((item) => item.trim()).filter(Boolean),
        visibility,
      };
      const preparedItems = normalizedItems();
      const saved = isEdit
        ? await updateItinerary(Number(id), payload)
        : await createItinerary({ ...payload, items: preparedItems });

      if (isEdit) {
        await Promise.all(deletedItemIds.map((itemId) => deleteItineraryItem(saved.id, itemId)));
        await Promise.all(preparedItems.map((item) => {
          if (item.id) return updateItineraryItem(saved.id, item.id, item);
          return addItineraryItem(saved.id, item);
        }));
      }
      navigate(`/itineraries/${saved.id}`);
    } catch {
      setError("Không thể lưu lịch trình. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (index: number, patch: Partial<ItineraryItem>) =>
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));

  const removeItem = (index: number) => {
    setItems((current) => {
      const item = current[index];
      if (item?.id) setDeletedItemIds((ids) => [...ids, item.id as number]);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  if (loading) {
    return <section className="mx-auto max-w-5xl px-4 py-10 text-muted-foreground">Đang tải lịch trình...</section>;
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-4xl font-semibold">{isEdit ? "Sửa lịch trình" : "Tạo lịch trình"}</h1>
      {error && <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <Card className="mt-6">
        <CardContent className="grid gap-3 pt-5">
          <Input placeholder="Tiêu đề" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Textarea placeholder="Mô tả" value={description} onChange={(event) => setDescription(event.target.value)} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input aria-label="Số ngày" min={1} type="number" value={totalDays} onChange={(event) => setTotalDays(Number(event.target.value))} />
            <Input placeholder="Ngân sách" value={budget} onChange={(event) => setBudget(event.target.value)} />
            <Input placeholder="Kiểu du lịch" value={travelStyle} onChange={(event) => setTravelStyle(event.target.value)} />
          </div>
          <Input placeholder="Sở thích, cách nhau bằng dấu phẩy" value={interests} onChange={(event) => setInterests(event.target.value)} />
          <select className="rounded-md border bg-background px-3 py-2 text-sm" value={visibility} onChange={(event) => setVisibility(event.target.value as Visibility)}>
            <option value="private">Riêng tư</option>
            <option value="public">Công khai</option>
            <option value="shared">Chia sẻ bằng link</option>
          </select>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Hoạt động</h2>
        <Button onClick={() => setItems((current) => [...current, { day_number: 1, title: "", order_index: current.length }])}>Thêm hoạt động</Button>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed p-6 text-sm text-muted-foreground">Lịch trình này chưa có hoạt động nào.</div>
      ) : (
        <div className="mt-4 grid gap-3">
          {items.map((item, index) => (
            <Card key={item.id ?? index}>
              <CardContent className="grid gap-2 pt-4 md:grid-cols-6">
                <Input min={1} type="number" value={item.day_number ?? 1} onChange={(event) => updateItem(index, { day_number: Number(event.target.value) })} />
                <Input type="time" value={item.start_time ?? ""} onChange={(event) => updateItem(index, { start_time: event.target.value })} />
                <Input className="md:col-span-2" placeholder="Tiêu đề" value={item.title ?? ""} onChange={(event) => updateItem(index, { title: event.target.value })} />
                <select className="rounded-md border bg-background px-3 py-2 text-sm" value={item.place_id ?? ""} onChange={(event) => updateItem(index, { place_id: event.target.value ? Number(event.target.value) : null })}>
                  <option value="">Hoạt động custom</option>
                  {places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
                </select>
                <Button variant="outline" onClick={() => removeItem(index)}>Xóa</Button>
                <Textarea className="md:col-span-3" placeholder="Ghi chú" value={item.note ?? ""} onChange={(event) => updateItem(index, { note: event.target.value })} />
                <Input className="md:col-span-1" placeholder="Chi phí" value={item.estimated_cost ?? ""} onChange={(event) => updateItem(index, { estimated_cost: event.target.value ? Number(event.target.value) : null })} />
                <Input className="md:col-span-2" placeholder="Di chuyển" value={item.transport_note ?? ""} onChange={(event) => updateItem(index, { transport_note: event.target.value })} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button onClick={() => void save()} disabled={saving || !title.trim()}>{saving ? "Đang lưu..." : "Lưu lịch trình"}</Button>
        <Button variant="outline" onClick={() => navigate("/itineraries")}>Hủy</Button>
      </div>
    </section>
  );
}

function sortItems(a: Partial<ItineraryItem>, b: Partial<ItineraryItem>) {
  return (a.day_number ?? 1) - (b.day_number ?? 1)
    || String(a.start_time ?? "").localeCompare(String(b.start_time ?? ""))
    || (a.order_index ?? 0) - (b.order_index ?? 0);
}
