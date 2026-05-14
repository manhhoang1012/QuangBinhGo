import { api, authStorage, type User } from "@/services/api";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

interface AuthPayload {
  email: string;
  password: string;
  username?: string;
  full_name?: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

function persistAuth(response: AuthResponse) {
  authStorage.setToken(response.access_token);
  localStorage.setItem("auth_user", JSON.stringify(response.user));
  window.dispatchEvent(new Event("auth-change"));
  return response;
}

export async function login(payload: AuthPayload) {
  const response = await api.post<AuthResponse>("/auth/login", payload);
  return persistAuth(response.data);
}

export async function register(payload: Required<AuthPayload>) {
  const response = await api.post<AuthResponse>("/auth/register", payload);
  return persistAuth(response.data);
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch {
    // Local logout should still happen if the token is already invalid.
  }
  authStorage.clear();
  window.dispatchEvent(new Event("auth-change"));
}

export async function refreshToken() {
  const response = await api.post<AuthResponse>("/auth/refresh-token");
  return persistAuth(response.data);
}

export async function forgotPassword(email: string) {
  const response = await api.post<{ message: string; dev_url?: string | null }>("/auth/forgot-password", { email });
  return response.data;
}

export async function resetPassword(token: string, new_password: string, confirm_password: string) {
  const response = await api.post<{ message: string }>("/auth/reset-password", { token, new_password, confirm_password });
  return response.data;
}

export async function verifyEmail(token: string) {
  const response = await api.post<{ message: string }>("/auth/verify-email", { token });
  return response.data;
}

export async function resendVerificationEmail(email: string) {
  const response = await api.post<{ message: string; dev_url?: string | null }>("/auth/resend-verification-email", { email });
  return response.data;
}

export function getStoredUser(): User | null {
  const rawUser = localStorage.getItem("auth_user");
  return rawUser ? (JSON.parse(rawUser) as User) : null;
}

export function persistOAuthToken(token: string) {
  authStorage.setToken(token);
  window.dispatchEvent(new Event("auth-change"));
}
