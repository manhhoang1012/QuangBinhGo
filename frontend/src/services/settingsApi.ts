import { api } from "@/services/api";
import { uploadFiles } from "@/services/uploadApi";

export interface SiteSettings {
  site_name: string;
  site_description: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  facebook_url?: string | null;
  zalo_url?: string | null;
  youtube_url?: string | null;
  hero_title: string;
  hero_subtitle: string;
  hero_background_image?: string | null;
  featured_place_limit: number;
  show_featured_places: boolean;
  show_latest_posts: boolean;
  show_reviews_section: boolean;
  allow_user_posts: boolean;
  allow_comments: boolean;
  allow_reviews: boolean;
  auto_approve_posts: boolean;
  auto_approve_comments: boolean;
  max_images_per_post: number;
  max_images_per_place: number;
  default_place_status: "active" | "hidden" | "published" | "draft";
  enable_place_reviews: boolean;
  enable_place_map: boolean;
  allow_register: boolean;
  require_email_verification: boolean;
  default_user_role: "user";
}

export const fallbackSettings: SiteSettings = {
  site_name: "QuangBinhGo",
  site_description: "Website giới thiệu du lịch Quảng Bình",
  logo_url: null,
  favicon_url: null,
  contact_email: "",
  contact_phone: "",
  address: "",
  facebook_url: "",
  zalo_url: "",
  youtube_url: "",
  hero_title: "Caves, coastlines, and local stories in one trip.",
  hero_subtitle: "Plan meaningful days around Phong Nha, Dong Hoi, Nhat Le, and hidden local favorites with real traveler reviews.",
  hero_background_image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=85",
  featured_place_limit: 3,
  show_featured_places: true,
  show_latest_posts: true,
  show_reviews_section: true,
  allow_user_posts: true,
  allow_comments: true,
  allow_reviews: true,
  auto_approve_posts: true,
  auto_approve_comments: true,
  max_images_per_post: 10,
  max_images_per_place: 10,
  default_place_status: "published",
  enable_place_reviews: true,
  enable_place_map: true,
  allow_register: true,
  require_email_verification: false,
  default_user_role: "user",
};

export async function getAdminSettings() {
  const response = await api.get<SiteSettings>("/admin/settings");
  return response.data;
}

export async function updateAdminSettings(data: SiteSettings) {
  const response = await api.put<SiteSettings>("/admin/settings", data);
  return response.data;
}

export async function uploadSettingImage(file: File, type: "logo" | "favicon" | "hero" | "settings") {
  if (!file) {
    throw new Error("No file selected");
  }

  const response = await uploadFiles([file], "settings_image", type);
  return response.urls[0] || "";
}

export async function getPublicSettings() {
  const response = await api.get<SiteSettings>("/settings/public");
  return response.data;
}
