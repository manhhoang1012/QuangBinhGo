import { api, authStorage, type User } from "@/services/api";

interface AuthPayload {
  email: string;
  password: string;
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

export function logout() {
  authStorage.clear();
}

export function getStoredUser(): User | null {
  const rawUser = localStorage.getItem("auth_user");
  return rawUser ? (JSON.parse(rawUser) as User) : null;
}
