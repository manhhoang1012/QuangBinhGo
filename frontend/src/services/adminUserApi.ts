import { api, type User } from "@/services/api";

export interface AdminUserFilters {
  search?: string;
  role?: string;
  is_active?: boolean;
}

export async function getAdminUsers(params: AdminUserFilters = {}) {
  const response = await api.get<User[]>("/admin/users", { params });
  return response.data;
}

export async function updateAdminUserStatus(userId: number, is_active: boolean) {
  const response = await api.patch<User>(`/admin/users/${userId}/status`, { is_active });
  return response.data;
}

export async function updateAdminUserRole(userId: number, role: "user" | "moderator" | "admin") {
  const response = await api.patch<User>(`/admin/users/${userId}/role`, { role });
  return response.data;
}

export async function deleteAdminUser(userId: number) {
  const response = await api.delete<{ message: string }>(`/admin/users/${userId}`);
  return response.data;
}
