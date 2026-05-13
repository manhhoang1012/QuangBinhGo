import { getStoredUser } from "@/services/authApi";

export async function getCurrentProfile() {
  return getStoredUser();
}
