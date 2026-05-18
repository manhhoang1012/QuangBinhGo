import axios from "axios";

import { api, authStorage } from "@/services/api";

export type UploadType = "avatar" | "cover" | "post_image" | "post_video" | "place_image" | "review_image" | "settings_image";

export interface UploadedMedia {
  url: string;
  secure_url: string;
  public_id: string;
  resource_type: "image" | "video" | "raw";
  format?: string | null;
  bytes: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}

export async function uploadFiles(files: File[], uploadType: UploadType, entityId?: number | string) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("upload_type", uploadType);
  if (entityId) formData.append("entity_id", String(entityId));
  const token = authStorage.getToken();
  const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
  const response = await axios.post<{ items: UploadedMedia[]; urls: string[] }>(`${baseURL}/uploads`, formData, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function deleteUploadedAsset(publicId: string, resourceType: "image" | "video" | "raw" = "image") {
  const response = await api.delete<{ result: string }>("/uploads", { data: { public_id: publicId, resource_type: resourceType } });
  return response.data;
}

export async function uploadImage(file: File, uploadType: UploadType = "avatar") {
  const response = await uploadFiles([file], uploadType);
  return response.urls[0];
}
