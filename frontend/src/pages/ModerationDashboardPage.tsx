import { useEffect, useState } from "react";
import { Flag, MessageSquare, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { getModerationDashboard, type ModerationDashboard } from "@/services/moderationApi";

export function ModerationDashboardPage() {
  const [data, setData] = useState<ModerationDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        setData(await getModerationDashboard());
      } catch {
        setError("Could not load moderation dashboard.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const metrics = [
    { label: "Pending reports", value: data?.pending_reports ?? 0, icon: Flag },
    { label: "Reported posts", value: data?.reported_posts ?? 0, icon: MessageSquare },
    { label: "Reported comments", value: data?.reported_comments ?? 0, icon: MessageSquare },
    { label: "Reported reviews", value: data?.reported_reviews ?? 0, icon: ShieldCheck },
  ];

  return (
    <section>
      <AdminPageHeader description="Moderate reported community content and keep an audit trail." title="Moderation" />
      {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      {isLoading && <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((item) => <Card className="h-32 animate-pulse bg-muted/60" key={item.label} />)}</div>}
      {!isLoading && data && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label}>
                  <CardContent className="pt-5">
                    <Icon className="h-5 w-5 text-primary" />
                    <p className="mt-4 text-3xl font-semibold">{item.value}</p>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Recent actions</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {data.recent_actions.length === 0 && <p className="text-sm text-muted-foreground">No moderation actions yet.</p>}
                {data.recent_actions.map((action) => (
                  <div className="border-b pb-3 last:border-b-0 last:pb-0" key={action.id}>
                    <p className="font-medium">{action.action_type} - {action.target_type} #{action.target_id}</p>
                    <p className="text-sm text-muted-foreground">{action.moderator?.full_name ?? "Moderator"} - {action.reason} - {new Date(action.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Recent warnings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {data.recent_warnings.length === 0 && <p className="text-sm text-muted-foreground">No warnings yet.</p>}
                {data.recent_warnings.map((warning) => (
                  <div className="border-b pb-3 last:border-b-0 last:pb-0" key={warning.id}>
                    <p className="font-medium">{warning.user?.full_name ?? `User #${warning.user_id}`}</p>
                    <p className="text-sm text-muted-foreground">{warning.reason} - {new Date(warning.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </section>
  );
}
