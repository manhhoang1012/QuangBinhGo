import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { type User } from "@/services/api";
import { AdminLayout } from "@/layouts/AdminLayout";
import { authStorage } from "@/services/api";
import { getCurrentProfile } from "@/services/userApi";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const token = authStorage.getToken();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;
    void getCurrentProfile().then(setUser).catch(() => setUser(null)).finally(() => setIsLoading(false));
  }, [token]);

  if (!token) {
    return <Navigate replace to="/login" />;
  }

  if (isLoading) {
    return <section className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Checking access...</section>;
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (user.role !== "admin") {
    return <Navigate replace to="/" />;
  }

  return <AdminLayout user={user}>{children}</AdminLayout>;
}
