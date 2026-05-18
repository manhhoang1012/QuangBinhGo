import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { type AdminReport, getAdminReports, resolveReport } from "@/services/adminApi";

const reportTypes = [
  { label: "All", value: "" },
  { label: "Posts", value: "post" },
  { label: "Comments", value: "comment" },
  { label: "Reviews", value: "review" },
];

export function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAdminReports({ type: type || undefined, status: status || undefined, limit: 100 });
      setReports(response.items);
    } catch {
      setError("Could not load reports.");
    } finally {
      setIsLoading(false);
    }
  }, [status, type]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const updateStatus = async (report: AdminReport, nextStatus: "resolved" | "rejected") => {
    if (report.type === "user") {
      setError("User reports need a backend target model before they can be resolved here.");
      return;
    }
    try {
      await resolveReport(report.id, { type: report.type, status: nextStatus });
      setNotice(nextStatus === "resolved" ? "Report resolved." : "Report rejected.");
      await loadReports();
    } catch {
      setError("Could not update report status.");
    }
  };

  return (
    <section>
      <AdminPageHeader description="Review community reports and close handled moderation cases." title="Reports" />
      {notice && <div className="mt-6 rounded-lg border bg-accent/10 p-4 text-sm text-accent">{notice}</div>}
      {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

      <div className="mt-6 grid gap-2 sm:grid-cols-[180px_180px_auto]">
        <select className="rounded-md border bg-background px-3 py-2 text-sm" onChange={(event) => setType(event.target.value)} value={type}>
          {reportTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select className="rounded-md border bg-background px-3 py-2 text-sm" onChange={(event) => setStatus(event.target.value)} value={status}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
        <Button onClick={() => void loadReports()} variant="outline">Refresh</Button>
      </div>

      {isLoading && <Card className="mt-6 h-48 animate-pulse bg-muted/60" />}
      {!isLoading && reports.length === 0 && <div className="mt-6 rounded-lg border bg-background p-8 text-center text-muted-foreground">No reports found.</div>}

      <div className="mt-6 grid gap-4">
        {reports.map((report) => (
          <Card key={`${report.type}-${report.id}`}>
            <CardContent className="grid gap-4 pt-5 lg:grid-cols-[1fr_220px] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium uppercase">{report.type}</span>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">{report.status}</span>
                </div>
                <p className="mt-3 font-medium">{report.target_label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reporter: {report.reporter?.full_name ?? "Unknown"} - Reason: {report.reason} - {new Date(report.created_at).toLocaleString()}
                </p>
                {report.detail && <p className="mt-2 text-sm text-muted-foreground">{report.detail}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={report.status === "resolved"} onClick={() => void updateStatus(report, "resolved")} variant="outline">Resolve</Button>
                <Button disabled={report.status === "rejected"} onClick={() => void updateStatus(report, "rejected")} variant="outline">Reject</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
