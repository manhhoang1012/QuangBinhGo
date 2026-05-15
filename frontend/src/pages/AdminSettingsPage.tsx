import { useEffect, useState } from "react";
import { type ReactNode } from "react";
import axios from "axios";
import { Save, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { fallbackSettings, getAdminSettings, type SiteSettings, updateAdminSettings, uploadSettingImage } from "@/services/settingsApi";

type UploadField = "logo_url" | "favicon_url" | "hero_background_image";

const uploadTypeByField: Record<UploadField, "logo" | "favicon" | "hero"> = {
  logo_url: "logo",
  favicon_url: "favicon",
  hero_background_image: "hero",
};
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export function AdminSettingsPage() {
  const [form, setForm] = useState<SiteSettings>(fallbackSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        setForm(await getAdminSettings());
      } catch {
        setError("Could not load settings.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const save = async () => {
    setMessage(null);
    setError(null);
    if (!form.site_name.trim() || !form.site_description.trim()) {
      setError("Site name and description are required.");
      return;
    }
    if (form.featured_place_limit < 1 || form.max_images_per_place < 1 || form.max_images_per_post < 1) {
      setError("Limits must be positive numbers.");
      return;
    }

    setIsSaving(true);
    try {
      setForm(await updateAdminSettings(form));
      setMessage("Settings saved successfully.");
    } catch {
      setError("Could not save settings. Check validation and admin permission.");
    } finally {
      setIsSaving(false);
    }
  };

  const uploadImage = async (file: File | undefined, field: UploadField) => {
    if (!file) return;
    setMessage(null);
    setError(null);
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be 5MB or smaller.");
      return;
    }
    try {
      const url = await uploadSettingImage(file, uploadTypeByField[field]);
      setFormValue(field, url);
      setMessage("Image uploaded. Save settings to keep this change.");
    } catch (uploadError) {
      setError(getUploadErrorMessage(uploadError));
    }
  };

  if (isLoading) {
    return <div className="rounded-lg border bg-muted/50 p-8 text-muted-foreground">Loading settings...</div>;
  }

  return (
    <section>
      <AdminPageHeader
        action={<Button className="gap-2" disabled={isSaving} onClick={() => void save()}><Save className="h-4 w-4" />{isSaving ? "Saving..." : "Save settings"}</Button>}
        description="Configure public site identity, homepage, social, places, and security behavior."
        title="Settings"
      />
      {message && <AlertMessage text={message} tone="success" />}
      {error && <AlertMessage text={error} tone="error" />}

      <div className="mt-6 grid gap-6">
        <SettingsSection title="General">
          <TextInput label="Site name" onChange={(value) => setFormValue("site_name", value)} value={form.site_name} />
          <TextInput label="Site description" onChange={(value) => setFormValue("site_description", value)} value={form.site_description} wide />
          <ImageInput field="logo_url" label="Logo" onUpload={uploadImage} url={form.logo_url} />
          <ImageInput field="favicon_url" label="Favicon" onUpload={uploadImage} url={form.favicon_url} />
          <TextInput label="Contact email" onChange={(value) => setFormValue("contact_email", value)} type="email" value={form.contact_email ?? ""} />
          <TextInput label="Contact phone" onChange={(value) => setFormValue("contact_phone", value)} value={form.contact_phone ?? ""} />
          <TextInput label="Address" onChange={(value) => setFormValue("address", value)} value={form.address ?? ""} wide />
          <TextInput label="Facebook URL" onChange={(value) => setFormValue("facebook_url", value)} type="url" value={form.facebook_url ?? ""} />
          <TextInput label="Zalo URL" onChange={(value) => setFormValue("zalo_url", value)} type="url" value={form.zalo_url ?? ""} />
          <TextInput label="YouTube URL" onChange={(value) => setFormValue("youtube_url", value)} type="url" value={form.youtube_url ?? ""} />
        </SettingsSection>

        <SettingsSection title="Homepage">
          <TextInput label="Hero title" onChange={(value) => setFormValue("hero_title", value)} value={form.hero_title} wide />
          <TextareaField label="Hero subtitle" onChange={(value) => setFormValue("hero_subtitle", value)} value={form.hero_subtitle} />
          <ImageInput field="hero_background_image" label="Hero background" onUpload={uploadImage} url={form.hero_background_image} />
          <NumberInput label="Featured place limit" onChange={(value) => setFormValue("featured_place_limit", value)} value={form.featured_place_limit} />
          <Toggle label="Show featured places" onChange={(value) => setFormValue("show_featured_places", value)} checked={form.show_featured_places} />
          <Toggle label="Show latest posts" onChange={(value) => setFormValue("show_latest_posts", value)} checked={form.show_latest_posts} />
          <Toggle label="Show reviews section" onChange={(value) => setFormValue("show_reviews_section", value)} checked={form.show_reviews_section} />
        </SettingsSection>

        <SettingsSection title="Social">
          <Toggle label="Allow user posts" onChange={(value) => setFormValue("allow_user_posts", value)} checked={form.allow_user_posts} />
          <Toggle label="Allow comments" onChange={(value) => setFormValue("allow_comments", value)} checked={form.allow_comments} />
          <Toggle label="Allow reviews" onChange={(value) => setFormValue("allow_reviews", value)} checked={form.allow_reviews} />
          <Toggle label="Auto approve posts" onChange={(value) => setFormValue("auto_approve_posts", value)} checked={form.auto_approve_posts} />
          <Toggle label="Auto approve comments" onChange={(value) => setFormValue("auto_approve_comments", value)} checked={form.auto_approve_comments} />
          <NumberInput label="Max images per post" onChange={(value) => setFormValue("max_images_per_post", value)} value={form.max_images_per_post} />
        </SettingsSection>

        <SettingsSection title="Places">
          <NumberInput label="Max images per place" onChange={(value) => setFormValue("max_images_per_place", value)} value={form.max_images_per_place} />
          <SelectInput label="Default place status" onChange={(value) => setFormValue("default_place_status", value as SiteSettings["default_place_status"])} options={["published", "active", "draft", "hidden"]} value={form.default_place_status} />
          <Toggle label="Enable place reviews" onChange={(value) => setFormValue("enable_place_reviews", value)} checked={form.enable_place_reviews} />
          <Toggle label="Enable place map" onChange={(value) => setFormValue("enable_place_map", value)} checked={form.enable_place_map} />
        </SettingsSection>

        <SettingsSection title="Security">
          <Toggle label="Allow register" onChange={(value) => setFormValue("allow_register", value)} checked={form.allow_register} />
          <Toggle label="Require email verification" onChange={(value) => setFormValue("require_email_verification", value)} checked={form.require_email_verification} />
          <SelectInput label="Default user role" onChange={() => setFormValue("default_user_role", "user")} options={["user"]} value={form.default_user_role} />
        </SettingsSection>
      </div>
    </section>
  );

  function setFormValue<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
}

function SettingsSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

function TextInput({ label, onChange, type = "text", value, wide }: { label: string; onChange: (value: string) => void; type?: string; value: string; wide?: boolean }) {
  return <label className={wide ? "md:col-span-2" : ""}><span className="text-sm font-medium">{label}</span><Input className="mt-1" onChange={(event) => onChange(event.target.value)} type={type} value={value} /></label>;
}

function TextareaField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return <label className="md:col-span-2"><span className="text-sm font-medium">{label}</span><Textarea className="mt-1" onChange={(event) => onChange(event.target.value)} value={value} /></label>;
}

function NumberInput({ label, onChange, value }: { label: string; onChange: (value: number) => void; value: number }) {
  return <label><span className="text-sm font-medium">{label}</span><Input className="mt-1" min={1} onChange={(event) => onChange(Number(event.target.value))} type="number" value={String(value)} /></label>;
}

function SelectInput({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: string[]; value: string }) {
  return <label><span className="text-sm font-medium">{label}</span><select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" onChange={(event) => onChange(event.target.value)} value={value}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return <label className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm font-medium"><span>{label}</span><input checked={checked} className="h-5 w-5" onChange={(event) => onChange(event.target.checked)} type="checkbox" /></label>;
}

function ImageInput({ field, label, onUpload, url }: { field: UploadField; label: string; onUpload: (file: File | undefined, field: UploadField) => void; url?: string | null }) {
  const handleChange = (file: File | undefined) => {
    console.log("SELECTED FILE:", file);
    if (file) {
      void onUpload(file, field);
    }
  };

  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      {url ? <img alt={label} className="mt-2 h-24 w-40 rounded-md border object-cover" src={url} /> : <div className="mt-2 flex h-24 w-40 items-center justify-center rounded-md border bg-muted/40 text-xs text-muted-foreground">No image</div>}
      <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
        <Upload className="h-4 w-4" /> Upload
        <input accept="image/png,image/jpeg,image/jpg,image/webp,image/x-icon,.ico" className="hidden" onChange={(event) => handleChange(event.target.files?.[0])} type="file" />
      </label>
    </div>
  );
}

function AlertMessage({ text, tone }: { text: string; tone: "error" | "success" }) {
  return <div className={`mt-6 rounded-lg border p-4 text-sm ${tone === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{text}</div>;
}

function getUploadErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return "Could not upload image. Please try again.";
  }

  const status = error.response?.status;
  const detail = error.response?.data?.detail;
  if (status === 401 || status === 403) return "Upload blocked: admin login is required.";
  if (status === 404) return "Upload endpoint was not found. Check backend route registration.";
  if (detail) return Array.isArray(detail) ? detail.map((item) => item.msg ?? JSON.stringify(item)).join(", ") : String(detail);
  if (status === 422) return "Upload request is invalid. Check file field and upload type.";
  if (status && status >= 500) return "Backend could not save the image. Check static upload folder permissions.";
  return "Could not upload image. Use jpg, png, webp, or ico for favicon.";
}
