import { useEffect, useRef, useState } from "react";
import { Camera, ExternalLink, Lock, MapPin, PenLine } from "lucide-react";
import { Navigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authStorage, type ReviewPost, type User } from "@/services/api";
import { uploadImage } from "@/services/uploadApi";
import {
  changePassword,
  getCurrentProfile,
  getMyPosts,
  getMyReviews,
  getMySavedPosts,
  updateCurrentProfile,
  type UpdateProfilePayload,
} from "@/services/userApi";

const emptyProfile: UpdateProfilePayload = {
  full_name: "",
  email: "",
  username: "",
  avatar_url: "",
  cover_image_url: "",
  bio: "",
  date_of_birth: "",
  gender: "prefer_not_to_say",
  location: "",
  phone_number: "",
  social_links: { facebook: "", instagram: "", tiktok: "", website: "" },
};

export function ProfilePage() {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<UpdateProfilePayload>(emptyProfile);
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<ReviewPost[]>([]);
  const [reviews, setReviews] = useState<Array<{ id: number; rating: number; content: string; place: { name: string } }>>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });

  const token = authStorage.getToken();

  useEffect(() => {
    if (!token) return;

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [profile, myPosts, mySavedPosts, myReviews] = await Promise.all([
          getCurrentProfile(),
          getMyPosts(),
          getMySavedPosts(),
          getMyReviews(),
        ]);
        setUser(profile);
        setForm(profileToForm(profile));
        setPosts(myPosts);
        setSavedPosts(mySavedPosts);
        setReviews(myReviews);
      } catch {
        setError("Could not load profile.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [token]);

  if (!token) return <Navigate replace to="/login" />;
  if (isLoading) return <section className="mx-auto max-w-6xl px-4 py-10 text-muted-foreground">Loading profile...</section>;

  const handleImageSelect = async (file: File | undefined, field: "avatar_url" | "cover_image_url") => {
    if (!file) return;
    setError(null);
    setSuccess(null);
    try {
      const uploadedUrl = await uploadImage(file, field === "avatar_url" ? "avatar" : "cover");
      setForm((current) => ({ ...current, [field]: uploadedUrl }));
      setSuccess(field === "avatar_url" ? "Avatar uploaded. Save profile to apply it." : "Cover image uploaded. Save profile to apply it.");
    } catch {
      setError("Image upload failed.");
    }
  };

  const handleProfileSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateCurrentProfile(normalizeProfilePayload(form));
      setUser(updated);
      setForm(profileToForm(updated));
      setIsEditing(false);
      setSuccess("Profile updated successfully.");
    } catch {
      setError("Could not update profile. Check duplicate email/username or invalid links.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setError(null);
    setSuccess(null);
    try {
      const response = await changePassword(passwordForm);
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setSuccess(response.message);
    } catch {
      setError("Could not change password. Check your current password and confirmation.");
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {error && <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      {success && <div className="mb-6 rounded-lg border bg-accent/10 p-4 text-sm text-accent">{success}</div>}

      <div className="overflow-hidden rounded-lg border bg-muted/40">
        <button className="relative h-44 w-full bg-primary/15 text-left" disabled={!isEditing} onClick={() => coverInputRef.current?.click()} type="button">
          {form.cover_image_url && <img alt="Profile cover" className="h-full w-full object-cover" src={form.cover_image_url} />}
          {isEditing && <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-3 py-2 text-sm text-white">Upload cover</span>}
        </button>
        <input accept="image/*" className="hidden" onChange={(event) => void handleImageSelect(event.target.files?.[0], "cover_image_url")} ref={coverInputRef} type="file" />
        <div className="px-6 pb-6">
          <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <button className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-primary text-3xl font-semibold text-primary-foreground shadow-sm" disabled={!isEditing} onClick={() => avatarInputRef.current?.click()} type="button">
                {form.avatar_url ? <img alt={user?.full_name ?? "Profile avatar"} className="h-full w-full object-cover" src={form.avatar_url} /> : initials(user?.full_name)}
                {isEditing && <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/55 py-1 text-xs text-white"><Camera className="mr-1 h-3 w-3" />Upload</span>}
              </button>
              <input accept="image/*" className="hidden" onChange={(event) => void handleImageSelect(event.target.files?.[0], "avatar_url")} ref={avatarInputRef} type="file" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold">{user?.full_name}</h1>
                  <Badge>{user?.role ?? "user"}</Badge>
                  {user?.email_verified && <Badge>Email verified</Badge>}
                </div>
                <p className="mt-1 text-muted-foreground">@{user?.username || "not-set"}</p>
                <p className="mt-1 flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />{user?.location || user?.email}</p>
              </div>
            </div>
            {!isEditing && <Button className="gap-2" onClick={() => setIsEditing(true)} variant="outline"><PenLine className="h-4 w-4" />Edit profile</Button>}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="My posts" value={posts.length} />
        <StatCard label="Saved posts" value={savedPosts.length} />
        <StatCard label="Place reviews" value={reviews.length} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{isEditing ? "Edit profile" : "Profile information"}</CardTitle></CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Input onChange={(event) => setFormValue("full_name", event.target.value)} placeholder="Full name" value={form.full_name ?? ""} />
                <Input onChange={(event) => setFormValue("username", event.target.value)} placeholder="Username" value={form.username ?? ""} />
                <Input onChange={(event) => setFormValue("email", event.target.value)} placeholder="Email" value={form.email ?? ""} />
                <Input onChange={(event) => setFormValue("date_of_birth", event.target.value)} type="date" value={form.date_of_birth ?? ""} />
                <select className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setFormValue("gender", event.target.value)} value={form.gender ?? "prefer_not_to_say"}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                <Input onChange={(event) => setFormValue("location", event.target.value)} placeholder="Location" value={form.location ?? ""} />
                <Input onChange={(event) => setFormValue("phone_number", event.target.value)} placeholder="Phone number" value={form.phone_number ?? ""} />
                {(["facebook", "instagram", "tiktok", "website"] as const).map((key) => (
                  <Input key={key} onChange={(event) => setSocialLink(key, event.target.value)} placeholder={`${key} URL`} value={form.social_links?.[key] ?? ""} />
                ))}
                <Textarea className="md:col-span-2" onChange={(event) => setFormValue("bio", event.target.value)} placeholder="Bio" value={form.bio ?? ""} />
                <div className="flex gap-2 md:col-span-2">
                  <Button disabled={isSaving} onClick={() => void handleProfileSave()}>{isSaving ? "Saving..." : "Save changes"}</Button>
                  <Button disabled={isSaving} onClick={() => { if (user) setForm(profileToForm(user)); setIsEditing(false); }} variant="outline">Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <ProfileRow label="Email" value={user?.email} />
                <ProfileRow label="Bio" value={user?.bio} />
                <ProfileRow label="Gender" value={formatGender(user?.gender)} />
                <ProfileRow label="Date of birth" value={user?.date_of_birth} />
                <ProfileRow label="Location" value={user?.location} />
                <ProfileRow label="Phone" value={user?.phone_number || user?.phone} />
                <SocialLinks user={user} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4" />Change password</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))} placeholder="Current password" type="password" value={passwordForm.current_password} />
            <Input onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))} placeholder="New password" type="password" value={passwordForm.new_password} />
            <Input onChange={(event) => setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))} placeholder="Confirm new password" type="password" value={passwordForm.confirm_password} />
            <Button onClick={() => void handlePasswordChange()}>Update password</Button>
          </CardContent>
        </Card>
      </div>

      <ActivitySection posts={posts} reviews={reviews} savedPosts={savedPosts} />
    </section>
  );

  function setFormValue(key: keyof UpdateProfilePayload, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setSocialLink(key: "facebook" | "instagram" | "tiktok" | "website", value: string) {
    setForm((current) => ({ ...current, social_links: { ...current.social_links, [key]: value } }));
  }
}

function StatCard({ label, value }: { label: string; value: number }) {
  return <Card><CardContent className="pt-5"><p className="text-2xl font-semibold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></CardContent></Card>;
}

function ProfileRow({ label, value }: { label: string; value?: string | null }) {
  return <div><p className="font-medium">{label}</p><p className="mt-1 text-muted-foreground">{value || "Not set"}</p></div>;
}

function SocialLinks({ user }: { user: User | null }) {
  const links = user?.social_links;
  if (!links) return <ProfileRow label="Social links" value={undefined} />;
  return (
    <div>
      <p className="font-medium">Social links</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {Object.entries(links).filter(([, value]) => value).map(([key, value]) => (
          <a className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm hover:bg-muted" href={value ?? "#"} key={key} rel="noreferrer" target="_blank">{key}<ExternalLink className="h-3 w-3" /></a>
        ))}
      </div>
    </div>
  );
}

function ActivitySection({ posts, savedPosts, reviews }: { posts: ReviewPost[]; savedPosts: ReviewPost[]; reviews: Array<{ id: number; rating: number; content: string; place: { name: string } }> }) {
  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-3">
      <MiniList title="My posts" empty="No posts yet." items={posts.map((post) => ({ id: post.id, title: post.title, meta: post.place?.name ?? "No place" }))} />
      <MiniList title="Saved posts" empty="No saved posts yet." items={savedPosts.map((post) => ({ id: post.id, title: post.title, meta: post.place?.name ?? "No place" }))} />
      <MiniList title="Place reviews" empty="No place reviews yet." items={reviews.map((review) => ({ id: review.id, title: review.place.name, meta: `${review.rating}/5 - ${review.content}` }))} />
    </div>
  );
}

function MiniList({ title, empty, items }: { title: string; empty: string; items: Array<{ id: number; title: string; meta: string }> }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground">{empty}</p>}
        {items.slice(0, 5).map((item) => (
          <div className="border-b pb-3 last:border-b-0 last:pb-0" key={item.id}>
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.meta}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function initials(name?: string) {
  return name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "QB";
}

function profileToForm(user: User): UpdateProfilePayload {
  return {
    full_name: user.full_name,
    email: user.email,
    username: user.username ?? "",
    avatar_url: user.avatar_url ?? "",
    cover_image_url: user.cover_image_url ?? "",
    bio: user.bio ?? "",
    date_of_birth: user.date_of_birth ?? "",
    gender: user.gender ?? "prefer_not_to_say",
    location: user.location ?? "",
    phone_number: user.phone_number ?? user.phone ?? "",
    social_links: user.social_links ?? { facebook: "", instagram: "", tiktok: "", website: "" },
  };
}

function normalizeProfilePayload(form: UpdateProfilePayload): UpdateProfilePayload {
  return Object.fromEntries(
    Object.entries(form).map(([key, value]) => {
      if (value && typeof value === "object" && key === "social_links") {
        return [key, Object.fromEntries(Object.entries(value).map(([linkKey, linkValue]) => [linkKey, linkValue || null]))];
      }
      return [key, value === "" ? null : value];
    }),
  ) as UpdateProfilePayload;
}

function formatGender(gender?: string | null) {
  if (!gender) return undefined;
  return gender.replace(/_/g, " ");
}
