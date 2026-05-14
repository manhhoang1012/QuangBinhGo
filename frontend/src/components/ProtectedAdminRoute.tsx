import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { authStorage } from "@/services/api";
import { type User } from "@/services/api";
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
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="pt-6">
            <h1 className="text-2xl font-semibold">Access denied</h1>
            <p className="mt-2 text-muted-foreground">
              You need an admin account to access this dashboard.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return children;
}
