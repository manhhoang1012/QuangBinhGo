import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { getAdminAuditLogs, type AdminAuditLog } from "@/services/adminApi";

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getAdminAuditLogs({ action: action || undefined, target_type: targetType || undefined, limit: 100 });
        setLogs(response.items);
      } catch {
        setError("Could not load audit logs.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [action, targetType]);

  return (
    <section>
      <AdminPageHeader description="Security audit trail for admin and moderation actions." title="Audit logs" />
      {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      <div className="mt-6 grid gap-2 md:grid-cols-2">
        <Input onChange={(event) => setAction(event.target.value)} placeholder="Filter by action, e.g. users.role_update" value={action} />
        <Input onChange={(event) => setTargetType(event.target.value)} placeholder="Filter by target type, e.g. user" value={targetType} />
      </div>
      {isLoading && <Card className="mt-6 h-48 animate-pulse bg-muted/60" />}
      {!isLoading && logs.length === 0 && <div className="mt-6 rounded-lg border bg-background p-8 text-center text-muted-foreground">No audit logs found.</div>}
      <div className="mt-6 grid gap-4">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="grid gap-3 pt-5 lg:grid-cols-[1fr_220px] lg:items-center">
              <div>
                <p className="font-medium">{log.action}</p>
                <p className="text-sm text-muted-foreground">
                  {log.actor?.full_name ?? "System"} - {log.target_type} {log.target_id ? `#${log.target_id}` : ""} - {log.ip_address ?? "no ip"}
                </p>
                {log.metadata && <p className="mt-1 text-xs text-muted-foreground">{JSON.stringify(log.metadata)}</p>}
              </div>
              <p className="text-sm text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
