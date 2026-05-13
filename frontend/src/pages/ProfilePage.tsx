import { useEffect, useRef, useState } from "react";
import { Bookmark, Camera, Heart, MapPin, PenLine } from "lucide-react";
import { Navigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authStorage, type ReviewPost, type User } from "@/services/api";
import { getCommunityFeed, getSavedPostIds } from "@/services/postApi";
import { uploadImage } from "@/services/uploadApi";
import {
  changePassword,
  getCurrentProfile,
  updateCurrentProfile,
  type UpdateProfilePayload,
} from "@/services/userApi";

const emptyProfile: UpdateProfilePayload = {
  full_name: "",
  email: "",
  avatar_url: "",
  bio: "",
  date_of_birth: "",
  gender: "prefer_not_to_say",
  location: "",
  phone: "",
};

export function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<UpdateProfilePayload>(emptyProfile);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const token = authStorage.getToken();

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const profile = await getCurrentProfile();
        setUser(profile);
        setForm(profileToForm(profile));
      } catch {
        setError("Could not load profile.");
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      void loadProfile();
      void getCommunityFeed("latest").then((feed) => setPosts(feed.slice(0, 2))).catch(() => setPosts([]));
      setSavedCount(getSavedPostIds().length);
    }
  }, [token]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  if (!token) {
    return <Navigate replace to="/login" />;
  }

  const handleProfileSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedUser = await updateCurrentProfile(
        normalizeProfilePayload(form),
      );
      setUser(updatedUser);
      setForm(profileToForm(updatedUser));
      setAvatarPreview(null);
      setIsEditing(false);
      setSuccess("Profile updated successfully.");
    } catch (saveError) {
      console.error("Profile update error:", saveError);
      setError(saveError instanceof Error ? saveError.message : "Could not update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) setForm(profileToForm(user));
    if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setError(null);
    setIsEditing(false);
  };

  const handleAvatarSelect = async (file: File | undefined) => {
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsUploadingAvatar(true);
    setError(null);
    setSuccess(null);

    try {
      const uploadedUrl = await uploadImage(file);
      URL.revokeObjectURL(previewUrl);
      setForm((current) => ({ ...current, avatar_url: uploadedUrl }));
      setAvatarPreview(uploadedUrl);
      setSuccess("Avatar uploaded. Save profile to apply it.");
    } catch (uploadError) {
      console.error("Avatar upload error:", uploadError);
      setError(uploadError instanceof Error ? uploadError.message : "Avatar upload failed.");
    } finally {
      setIsUploadingAvatar(false);
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

  if (isLoading) {
    return <section className="mx-auto max-w-6xl px-4 py-10 text-muted-foreground">Loading profile...</section>;
  }

  const displayAvatar = avatarPreview || form.avatar_url || user?.avatar_url;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {error && <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      {success && <div className="mb-6 rounded-lg border bg-accent/10 p-4 text-sm text-accent">{success}</div>}

      <div className="overflow-hidden rounded-lg border bg-muted/40">
        <div className="h-32 bg-primary/15" />
        <div className="px-6 pb-6">
          <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <button
                className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-primary text-3xl font-semibold text-primary-foreground shadow-sm"
                disabled={!isEditing}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                {displayAvatar ? (
                  <img alt={user?.full_name ?? "Profile avatar"} className="h-full w-full object-cover" src={displayAvatar} />
                ) : (
                  initials(user?.full_name)
                )}
                {isEditing && (
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/55 py-1 text-xs text-white">
                    <Camera className="mr-1 h-3 w-3" />
                    Upload
                  </span>
                )}
              </button>
              <input
                accept="image/*"
                className="hidden"
                onChange={(event) => void handleAvatarSelect(event.target.files?.[0])}
                ref={fileInputRef}
                type="file"
              />
              <div>
                <h1 className="text-3xl font-semibold">{user?.full_name}</h1>
                <p className="mt-1 flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {user?.location || user?.email}
                </p>
              </div>
            </div>
            {!isEditing && (
              <Button className="gap-2" onClick={() => setIsEditing(true)} variant="outline">
                <PenLine className="h-4 w-4" />
                Edit profile
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-5"><p className="text-2xl font-semibold">-</p><p className="text-sm text-muted-foreground">My posts</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-2xl font-semibold">-</p><p className="text-sm text-muted-foreground">Likes received</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-2xl font-semibold">{savedCount}</p><p className="text-sm text-muted-foreground">Saved posts</p></CardContent></Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit profile" : "Profile information"}</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Input onChange={(event) => setFormValue("full_name", event.target.value)} placeholder="Full name" value={form.full_name ?? ""} />
                <Input onChange={(event) => setFormValue("email", event.target.value)} placeholder="Email" value={form.email ?? ""} />
                <Input onChange={(event) => setFormValue("date_of_birth", event.target.value)} type="date" value={form.date_of_birth ?? ""} />
                <select
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) => setFormValue("gender", event.target.value)}
                  value={form.gender ?? "prefer_not_to_say"}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                <Input onChange={(event) => setFormValue("location", event.target.value)} placeholder="Location" value={form.location ?? ""} />
                <Input onChange={(event) => setFormValue("phone", event.target.value)} placeholder="Phone" value={form.phone ?? ""} />
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {isUploadingAvatar ? "Uploading avatar..." : form.avatar_url ? "Avatar uploaded and ready to save." : "No avatar uploaded yet."}
                </div>
                <Button disabled={isUploadingAvatar || isSaving} onClick={() => fileInputRef.current?.click()} type="button" variant="outline">
                  {isUploadingAvatar ? "Uploading..." : "Upload avatar"}
                </Button>
                <Textarea className="md:col-span-2" onChange={(event) => setFormValue("bio", event.target.value)} placeholder="Bio" value={form.bio ?? ""} />
                <div className="flex gap-2 md:col-span-2">
                  <Button disabled={isSaving || isUploadingAvatar} onClick={() => void handleProfileSave()}>
                    {isSaving ? "Saving..." : "Save changes"}
                  </Button>
                  <Button disabled={isSaving || isUploadingAvatar} onClick={handleCancelEdit} variant="outline">Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <ProfileRow label="Email" value={user?.email} />
                <ProfileRow label="Bio" value={user?.bio} />
                <ProfileRow label="Gender" value={formatGender(user?.gender)} />
                <ProfileRow label="Date of birth" value={user?.date_of_birth} />
                <ProfileRow label="Location" value={user?.location} />
                <ProfileRow label="Phone" value={user?.phone} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              onChange={(event) => setPasswordForm((current) => ({ ...current, current_password: event.target.value }))}
              placeholder="Current password"
              type="password"
              value={passwordForm.current_password}
            />
            <Input
              onChange={(event) => setPasswordForm((current) => ({ ...current, new_password: event.target.value }))}
              placeholder="New password"
              type="password"
              value={passwordForm.new_password}
            />
            <Input
              onChange={(event) => setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))}
              placeholder="Confirm new password"
              type="password"
              value={passwordForm.confirm_password}
            />
            <Button onClick={() => void handlePasswordChange()}>Update password</Button>
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-10 text-2xl font-semibold">Recent activity</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {posts.length === 0 && (
          <Card>
            <CardContent className="pt-5 text-sm text-muted-foreground">No recent activity yet.</CardContent>
          </Card>
        )}
        {posts.slice(0, 2).map((post) => (
          <Card key={post.id}>
            <CardContent className="pt-5">
              <Badge>{post.place.name}</Badge>
              <h3 className="mt-3 font-semibold">{post.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.content}</p>
              <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Heart className="h-4 w-4" />{post.likes_count}</span>
                <span className="flex items-center gap-1"><Bookmark className="h-4 w-4" />{post.saves_count}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );

  function setFormValue(key: keyof UpdateProfilePayload, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }
}

function ProfileRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-muted-foreground">{value || "Not set"}</p>
    </div>
  );
}

function initials(name?: string) {
  return name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "QB";
}

function profileToForm(user: User): UpdateProfilePayload {
  return {
    full_name: user.full_name,
    email: user.email,
    avatar_url: user.avatar_url ?? "",
    bio: user.bio ?? "",
    date_of_birth: user.date_of_birth ?? "",
    gender: user.gender ?? "prefer_not_to_say",
    location: user.location ?? "",
    phone: user.phone ?? "",
  };
}

function normalizeProfilePayload(form: UpdateProfilePayload): UpdateProfilePayload {
  return Object.fromEntries(
    Object.entries(form).map(([key, value]) => [key, value === "" ? null : value]),
  ) as UpdateProfilePayload;
}

function formatGender(gender?: string | null) {
  if (!gender) return undefined;
  return gender.replace(/_/g, " ");
}
