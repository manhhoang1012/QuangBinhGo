export {
  deleteUser as deleteAdminUser,
  getAdminUsers,
  updateUserRole as updateAdminUserRole,
  updateUserStatus as updateAdminUserStatus,
} from "@/services/adminApi";

export interface AdminUserFilters {
  search?: string;
  role?: string;
  is_active?: boolean;
}
