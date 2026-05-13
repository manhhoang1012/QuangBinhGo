import { api, type User } from "@/services/api";

export async function getCurrentProfile() {
  const response = await api.get<User>("/users/me");
  localStorage.setItem("auth_user", JSON.stringify(response.data));
  window.dispatchEvent(new Event("auth-change"));
  return response.data;
}

export type UpdateProfilePayload = Partial<
  Pick<User, "full_name" | "email" | "avatar_url" | "bio" | "date_of_birth" | "gender" | "location" | "phone">
>;

export async function updateCurrentProfile(payload: UpdateProfilePayload) {
  const response = await api.patch<User>("/users/me", payload);
  localStorage.setItem("auth_user", JSON.stringify(response.data));
  window.dispatchEvent(new Event("auth-change"));
  return response.data;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export async function changePassword(payload: ChangePasswordPayload) {
  const response = await api.patch<{ message: string }>("/users/me/password", payload);
  return response.data;
}
