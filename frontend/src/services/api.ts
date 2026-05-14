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
  setToken(token: string) {
    localStorage.setItem("access_token", token);
  },
  clear() {
    localStorage.removeItem("access_token");
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
}

export interface Place {
  id: number;
  name: string;
  description: string;
  category: string;
  address: string;
  latitude: string | number;
  longitude: string | number;
  images: string[];
  rating_avg: string | number;
}

export interface ReviewPost {
  id: number;
  title: string;
  content: string;
  place_id: number;
  images: string[];
  author: User;
  place: Place;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  content: string;
  author: User;
  created_at: string;
}
