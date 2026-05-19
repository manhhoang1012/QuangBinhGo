import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

export const authStorage = {
  getToken() {
    return localStorage.getItem("access_token");
  },
  getRefreshToken() {
    return localStorage.getItem("refresh_token");
  },
  setToken(token: string) {
    localStorage.setItem("access_token", token);
  },
  setRefreshToken(token: string) {
    localStorage.setItem("refresh_token", token);
  },
  clear() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("auth_user");
  },
};

api.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original?._retry || original?.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }
    const refreshToken = authStorage.getRefreshToken();
    if (!refreshToken) return Promise.reject(error);
    original._retry = true;
    refreshPromise ??= api.post("/auth/refresh", { refresh_token: refreshToken })
      .then((response) => {
        const access = response.data.access_token as string;
        const refresh = response.data.refresh_token as string | undefined;
        authStorage.setToken(access);
        if (refresh) authStorage.setRefreshToken(refresh);
        localStorage.setItem("auth_user", JSON.stringify(response.data.user));
        window.dispatchEvent(new Event("auth-change"));
        return access;
      })
      .catch(() => {
        authStorage.clear();
        window.dispatchEvent(new Event("auth-change"));
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
    const newToken = await refreshPromise;
    if (!newToken) return Promise.reject(error);
    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  },
);

export interface User {
  id: number;
  email: string;
  username?: string | null;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  role: "user" | "moderator" | "admin";
  email_verified: boolean;
  avatar_url?: string | null;
  cover_image_url?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
  location?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  social_links?: {
    facebook?: string | null;
    instagram?: string | null;
    tiktok?: string | null;
    website?: string | null;
  } | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
  is_self?: boolean;
  posts_count?: number;
  cover_url?: string | null;
}

export interface Place {
  id: number;
  name: string;
  slug?: string | null;
  description: string;
  category: string;
  region?: string | null;
  tags?: string[];
  status?: string;
  address: string;
  latitude: string | number;
  longitude: string | number;
  images: string[];
  videos?: string[];
  opening_hours?: string | null;
  ticket_price?: string | null;
  price_min?: string | number | null;
  price_max?: string | number | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  website_url?: string | null;
  facebook_url?: string | null;
  rating_avg: string | number;
  review_count?: number;
  cover_image?: string | null;
  distance_km?: number | null;
  related_places?: Place[];
  created_at?: string;
  updated_at?: string;
}

export interface ReviewPost {
  id: number;
  title: string;
  slug?: string | null;
  content: string;
  place_id?: number | null;
  images: string[];
  videos: string[];
  hashtags: string[];
  tagged_users: string[];
  visibility: "public" | "followers" | "private";
  is_draft: boolean;
  is_featured?: boolean;
  status?: string;
  author: User;
  place?: Place | null;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  share_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  content: string;
  author: User;
  parent_comment_id?: number | null;
  status: "visible" | "hidden" | "deleted" | "spam";
  like_count: number;
  likes_count: number;
  report_count: number;
  liked_by_me: boolean;
  replies: Comment[];
  created_at: string;
  updated_at: string;
}

export interface PlaceReview {
  id: number;
  place: Place;
  author: User;
  rating: number;
  content: string;
  images: string[];
  status: string;
  helpful_count: number;
  report_count: number;
  helpful_by_me?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  status: string;
}
