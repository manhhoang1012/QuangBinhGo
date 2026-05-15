import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { type Category } from "@/services/api";
import { createCategory, deleteCategory, getAdminCategories, updateCategory } from "@/services/adminApi";

const emptyForm = { name: "", slug: "", description: "", icon: "", status: "active" };

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<Omit<Category, "id">>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCategories(await getAdminCategories());
    } catch {
      setError("Could not load categories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      setError("Name and slug are required.");
      return;
    }
    try {
      if (editingId) {
        await updateCategory(editingId, form);
        setNotice("Category updated.");
      } else {
        await createCategory(form);
        setNotice("Category created.");
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch {
      setError("Could not save category. Check duplicate slug/name.");
    }
  };

  const edit = (category: Category) => {
    setEditingId(category.id);
    setForm({ name: category.name, slug: category.slug, description: category.description ?? "", icon: category.icon ?? "", status: category.status });
  };

  const remove = async (category: Category) => {
    if (!window.confirm(`Delete category ${category.name}?`)) return;
    try {
      await deleteCategory(category.id);
      setNotice("Category deleted.");
      await load();
    } catch {
      setError("Could not delete category.");
    }
  };

  return (
    <section>
      <AdminPageHeader description="Manage tourism category metadata." title="Categories" />
      {notice && <div className="mt-6 rounded-lg border bg-accent/10 p-4 text-sm text-accent">{notice}</div>}
      {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      <Card className="mt-6">
        <CardContent className="grid gap-4 pt-5 md:grid-cols-2">
          <Input onChange={(event) => setFormValue("name", event.target.value)} placeholder="Name" value={form.name} />
          <Input onChange={(event) => setFormValue("slug", event.target.value)} placeholder="slug-example" value={form.slug} />
          <Input onChange={(event) => setFormValue("icon", event.target.value)} placeholder="Icon name" value={form.icon ?? ""} />
          <select className="rounded-md border bg-background px-3 py-2 text-sm" onChange={(event) => setFormValue("status", event.target.value)} value={form.status}>
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
          </select>
          <Textarea className="md:col-span-2" onChange={(event) => setFormValue("description", event.target.value)} placeholder="Description" value={form.description ?? ""} />
          <Button onClick={() => void save()}>{editingId ? "Update category" : "Create category"}</Button>
          {editingId && <Button onClick={() => { setEditingId(null); setForm(emptyForm); }} variant="outline">Cancel edit</Button>}
        </CardContent>
      </Card>
      {isLoading && <Card className="mt-6 h-48 animate-pulse bg-muted/60" />}
      {!isLoading && categories.length === 0 && <div className="mt-6 rounded-lg border bg-background p-8 text-center text-muted-foreground">No categories found.</div>}
      <div className="mt-6 grid gap-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="grid gap-4 pt-5 lg:grid-cols-[1fr_180px] lg:items-center">
              <div><p className="font-medium">{category.name} <span className="text-muted-foreground">/{category.slug}</span></p><p className="text-sm text-muted-foreground">{category.status} - {category.description || "No description"}</p></div>
              <div className="flex gap-2"><Button onClick={() => edit(category)} variant="outline">Edit</Button><Button onClick={() => void remove(category)} variant="outline">Delete</Button></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );

  function setFormValue(key: keyof Omit<Category, "id">, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }
}
