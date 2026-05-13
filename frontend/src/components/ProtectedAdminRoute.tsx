import { Navigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { authStorage } from "@/services/api";
import { getStoredUser } from "@/services/authApi";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const token = authStorage.getToken();
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate replace to="/login" />;
  }

  if (!user.is_admin) {
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
