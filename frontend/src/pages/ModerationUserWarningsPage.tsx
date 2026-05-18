import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { getUserWarnings, type UserWarning } from "@/services/moderationApi";

export function ModerationUserWarningsPage() {
  const { userId } = useParams();
  const [warnings, setWarnings] = useState<UserWarning[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      setIsLoading(true);
      setError(null);
      try {
        setWarnings(await getUserWarnings(Number(userId)));
      } catch {
        setError("Could not load user warnings.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [userId]);

  return (
    <section>
      <AdminPageHeader description="Warnings issued to this user by moderators or admins." title="User warnings" />
      {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      {isLoading && <Card className="mt-6 h-48 animate-pulse bg-muted/60" />}
      {!isLoading && warnings.length === 0 && <div className="mt-6 rounded-lg border bg-background p-8 text-center text-muted-foreground">No warnings for this user.</div>}
      <div className="mt-6 grid gap-4">
        {warnings.map((warning) => (
          <Card key={warning.id}>
            <CardContent className="pt-5">
              <p className="font-medium">{warning.reason}</p>
              <p className="mt-1 text-sm text-muted-foreground">{warning.message}</p>
              <p className="mt-2 text-xs text-muted-foreground">By {warning.moderator?.full_name ?? "Moderator"} - {new Date(warning.created_at).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
