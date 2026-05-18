import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { getModerationActions, type ModerationAction } from "@/services/moderationApi";

export function ModerationActionsPage() {
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [targetType, setTargetType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        setActions(await getModerationActions({ target_type: targetType || undefined, limit: 100 }));
      } catch {
        setError("Could not load moderation actions.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [targetType]);

  return (
    <section>
      <AdminPageHeader description="Audit trail for content moderation decisions." title="Moderation actions" />
      {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      <div className="mt-6">
        <select className="rounded-md border bg-background px-3 py-2 text-sm" onChange={(event) => setTargetType(event.target.value)} value={targetType}>
          <option value="">All targets</option>
          <option value="post">Posts</option>
          <option value="comment">Comments</option>
          <option value="review">Reviews</option>
          <option value="user">Users</option>
        </select>
      </div>
      {isLoading && <Card className="mt-6 h-48 animate-pulse bg-muted/60" />}
      {!isLoading && actions.length === 0 && <div className="mt-6 rounded-lg border bg-background p-8 text-center text-muted-foreground">No moderation actions found.</div>}
      <div className="mt-6 grid gap-4">
        {actions.map((action) => (
          <Card key={action.id}>
            <CardContent className="grid gap-3 pt-5 md:grid-cols-[1fr_180px] md:items-center">
              <div>
                <p className="font-medium">{action.action_type} - {action.target_type} #{action.target_id}</p>
                <p className="text-sm text-muted-foreground">{action.moderator?.full_name ?? "Moderator"} - {action.reason}</p>
                {action.note && <p className="mt-1 text-sm text-muted-foreground">{action.note}</p>}
              </div>
              <p className="text-sm text-muted-foreground">{new Date(action.created_at).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
