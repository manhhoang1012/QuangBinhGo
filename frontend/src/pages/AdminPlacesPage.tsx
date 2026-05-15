import { useEffect, useState } from "react";
import { Plus, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { type Place } from "@/services/api";
import { createAdminPlace, deleteAdminPlace, getAdminPlaces, updateAdminPlace } from "@/services/adminApi";
import { type PlacePayload } from "@/services/placeApi";

const emptyForm: PlacePayload = {
  name: "",
  description: "",
  category: "nature",
  address: "",
  latitude: "",
  longitude: "",
  images: [],
  rating_avg: 4.5,
};

export function AdminPlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<PlacePayload>(emptyForm);
  const [editingPlaceId, setEditingPlaceId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadPlaces = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setPlaces(await getAdminPlaces({ search: search || undefined, limit: 100 }));
    } catch {
      setError("Could not load places.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPlaces();
  }, []);

  const startCreate = () => {
    setForm(emptyForm);
    setEditingPlaceId(null);
    setShowForm(true);
  };

  const startEdit = (place: Place) => {
    setForm({
      name: place.name,
      description: place.description,
      category: place.category,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      images: place.images,
      rating_avg: place.rating_avg,
    });
    setEditingPlaceId(place.id);
    setShowForm(true);
  };

  const savePlace = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.address.trim()) {
      setError("Name, description, and address are required.");
      return;
    }
    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (editingPlaceId) {
        await updateAdminPlace(editingPlaceId, form);
        setNotice("Place updated successfully.");
      } else {
        await createAdminPlace(form);
        setNotice("Place created successfully.");
      }
      setShowForm(false);
      await loadPlaces();
    } catch {
      setError("Could not save place. Check admin permission and form values.");
    } finally {
      setIsSaving(false);
    }
  };

  const removePlace = async (place: Place) => {
    if (!window.confirm(`Delete ${place.name}? This cannot be undone.`)) return;
    setError(null);
    try {
      await deleteAdminPlace(place.id);
      setNotice("Place deleted successfully.");
      await loadPlaces();
    } catch {
      setError("Could not delete place.");
    }
  };

  return (
    <section>
      <AdminPageHeader
        action={<Button className="gap-2" onClick={startCreate}><Plus className="h-4 w-4" />Add place</Button>}
        description="Create and maintain Quang Binh tourism places."
        title="Places"
      />
      {notice && <AlertMessage text={notice} tone="success" />}
      {error && <AlertMessage text={error} tone="error" />}

      {showForm && (
        <Card className="mt-6">
          <CardContent className="grid gap-4 pt-5 md:grid-cols-2">
            <Input onChange={(event) => setFormValue("name", event.target.value)} placeholder="Name" value={String(form.name)} />
            <Input onChange={(event) => setFormValue("category", event.target.value)} placeholder="Category" value={String(form.category)} />
            <Input className="md:col-span-2" onChange={(event) => setFormValue("address", event.target.value)} placeholder="Address/location" value={String(form.address)} />
            <Input onChange={(event) => setFormValue("latitude", event.target.value)} placeholder="Latitude" value={String(form.latitude)} />
            <Input onChange={(event) => setFormValue("longitude", event.target.value)} placeholder="Longitude" value={String(form.longitude)} />
            <Input onChange={(event) => setFormValue("rating_avg", Number(event.target.value))} placeholder="Rating" type="number" value={String(form.rating_avg)} />
            <Input onChange={(event) => setFormValue("images", event.target.value ? [event.target.value] : [])} placeholder="Image URL" value={form.images[0] ?? ""} />
            <Textarea className="md:col-span-2" onChange={(event) => setFormValue("description", event.target.value)} placeholder="Description" value={String(form.description)} />
            <div className="flex gap-2 md:col-span-2">
              <Button className="gap-2" disabled={isSaving} onClick={() => void savePlace()}><Save className="h-4 w-4" />{isSaving ? "Saving..." : "Save"}</Button>
              <Button className="gap-2" onClick={() => setShowForm(false)} variant="outline"><X className="h-4 w-4" />Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex gap-2">
        <Input onChange={(event) => setSearch(event.target.value)} placeholder="Search places" value={search} />
        <Button onClick={() => void loadPlaces()} variant="outline">Search</Button>
      </div>

      {isLoading && <Card className="mt-6 h-48 animate-pulse bg-muted/60" />}
      {!isLoading && places.length === 0 && <div className="mt-6 rounded-lg border bg-background p-8 text-center text-muted-foreground">No places found.</div>}
      <div className="mt-6 grid gap-4">
        {places.map((place) => (
          <Card key={place.id}>
            <CardContent className="grid gap-4 pt-5 lg:grid-cols-[96px_1fr_180px] lg:items-center">
              <img alt={place.name} className="h-24 w-24 rounded-md object-cover" src={place.images[0] ?? "https://placehold.co/400x400?text=QuangBinhGo"} />
              <div>
                <p className="font-medium">{place.name}</p>
                <p className="text-sm text-muted-foreground">{place.category} - {place.address}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{place.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => startEdit(place)} variant="outline">Edit</Button>
                <Button onClick={() => void removePlace(place)} variant="outline">Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );

  function setFormValue(key: keyof PlacePayload, value: PlacePayload[keyof PlacePayload]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
}

function AlertMessage({ text, tone }: { text: string; tone: "error" | "success" }) {
  return <div className={`mt-6 rounded-lg border p-4 text-sm ${tone === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{text}</div>;
}
