import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { PlaceForm } from "@/components/admin/PlaceForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { type Place } from "@/services/api";
import { createAdminPlace, deleteAdminPlace, getAdminPlaces, updateAdminPlace } from "@/services/adminApi";
import { type PlacePayload } from "@/services/placeApi";

export function AdminPlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [search, setSearch] = useState("");
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
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
    setEditingPlace(null);
    setShowForm(true);
  };

  const startEdit = (place: Place) => {
    setEditingPlace(place);
    setShowForm(true);
  };

  const savePlace = async (payload: PlacePayload) => {
    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (editingPlace) {
        await updateAdminPlace(editingPlace.id, payload);
        setNotice("Place updated successfully.");
      } else {
        await createAdminPlace(payload);
        setNotice("Place created successfully.");
      }
      setShowForm(false);
      setEditingPlace(null);
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
        description="Create and maintain Quang Binh tourism places with map-based coordinates and image uploads."
        title="Places"
      />
      {notice && <AlertMessage text={notice} tone="success" />}
      {error && <AlertMessage text={error} tone="error" />}

      {showForm && (
        <PlaceForm
          initialPlace={editingPlace}
          isSaving={isSaving}
          onCancel={() => { setShowForm(false); setEditingPlace(null); }}
          onSubmit={savePlace}
        />
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
            <CardContent className="grid gap-4 pt-5 lg:grid-cols-[96px_1fr_220px] lg:items-center">
              <img alt={place.name} className="h-24 w-24 rounded-md object-cover" src={place.images[0] ?? "https://placehold.co/400x400?text=QuangBinhGo"} />
              <div>
                <p className="font-medium">{place.name}</p>
                <p className="text-sm text-muted-foreground">{place.category} - {place.status ?? "active"} - {place.address}</p>
                <p className="mt-1 text-sm text-muted-foreground">{Number(place.latitude).toFixed(6)}, {Number(place.longitude).toFixed(6)}</p>
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
}

function AlertMessage({ text, tone }: { text: string; tone: "error" | "success" }) {
  return <div className={`mt-6 rounded-lg border p-4 text-sm ${tone === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{text}</div>;
}
