import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/components/common/toastStore";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { type AdminReport, getAdminReports, resolveReport } from "@/services/adminApi";

const reportTypes = [
  { label: "All", value: "" },
  { label: "Posts", value: "post" },
  { label: "Comments", value: "comment" },
  { label: "Reviews", value: "review" },
  { label: "Users", value: "user" },
];
const reasons = ["", "spam", "offensive", "harassment", "false_info", "scam", "inappropriate", "other"];
const actions = [
  { value: "none", label: "Không làm gì" },
  { value: "hide_content", label: "Ẩn nội dung" },
  { value: "delete_content", label: "Xóa nội dung" },
  { value: "warn_user", label: "Cảnh báo user" },
  { value: "block_user", label: "Khóa user" },
] as const;

export function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  const [resolveTarget, setResolveTarget] = useState<AdminReport | null>(null);
  const [action, setAction] = useState<(typeof actions)[number]["value"]>("none");
  const [resolutionNote, setResolutionNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAdminReports({ type: type || undefined, status: status || undefined, reason: reason || undefined, limit: 100 });
      setReports(response.items);
    } catch {
      setError("Could not load reports.");
    } finally {
      setIsLoading(false);
    }
  }, [reason, status, type]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const updateStatus = async (report: AdminReport, nextStatus: "resolved" | "rejected", selectedAction: typeof action = "none", note = "") => {
    try {
      await resolveReport(report.id, { type: report.type, status: nextStatus, action: selectedAction, resolution_note: note });
      setNotice(nextStatus === "resolved" ? "Report resolved." : "Report rejected.");
      showToast(nextStatus === "resolved" ? "Đã xử lý report." : "Đã từ chối report.", "success");
      await loadReports();
    } catch {
      setError("Could not update report status.");
      showToast("Không thể cập nhật report.", "error");
    }
  };

  return (
    <section>
      <AdminPageHeader description="Review community reports and close handled moderation cases." title="Reports" />
      {notice && <div className="mt-6 rounded-lg border bg-accent/10 p-4 text-sm text-accent">{notice}</div>}
      {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

      <div className="mt-6 grid gap-2 sm:grid-cols-[180px_180px_180px_auto]">
        <select className="rounded-md border bg-background px-3 py-2 text-sm" onChange={(event) => setType(event.target.value)} value={type}>
          {reportTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select className="rounded-md border bg-background px-3 py-2 text-sm" onChange={(event) => setStatus(event.target.value)} value={status}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="rounded-md border bg-background px-3 py-2 text-sm" onChange={(event) => setReason(event.target.value)} value={reason}>
          {reasons.map((item) => <option key={item} value={item}>{item || "All reasons"}</option>)}
        </select>
        <Button onClick={() => void loadReports()} variant="outline">Refresh</Button>
      </div>

      {isLoading && <Card className="mt-6 h-48 animate-pulse bg-muted/60" />}
      {!isLoading && reports.length === 0 && <div className="mt-6 rounded-lg border bg-background p-8 text-center text-muted-foreground">No reports found.</div>}

      <div className="mt-6 grid gap-4">
        {reports.map((report) => (
          <Card key={`${report.type}-${report.id}`}>
            <CardContent className="grid gap-4 pt-5 lg:grid-cols-[1fr_260px] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium uppercase">{report.type}</span>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">{report.status}</span>
                </div>
                <p className="mt-3 font-medium">{report.target_label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reporter: {report.reporter?.full_name ?? "Unknown"} - Reason: {report.reason} - {new Date(report.created_at).toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Target user: {report.target_author?.full_name ?? "Unknown"}</p>
                {report.detail && <p className="mt-2 text-sm text-muted-foreground">{report.detail}</p>}
                {report.resolution_note && <p className="mt-2 text-sm text-muted-foreground">Resolution: {report.resolution_note}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={report.status === "resolved"} onClick={() => { setResolveTarget(report); setAction("none"); setResolutionNote(""); }} variant="outline">Resolve</Button>
                <Button disabled={report.status === "rejected"} onClick={() => void updateStatus(report, "rejected", "none", "Report không hợp lệ")} variant="outline">Reject</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {resolveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-lg border bg-background p-5 shadow-xl">
            <h2 className="text-xl font-semibold">Resolve report</h2>
            <p className="mt-1 text-sm text-muted-foreground">{resolveTarget.target_label}</p>
            <div className="mt-4 space-y-3">
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={action} onChange={(event) => setAction(event.target.value as typeof action)}>
                {actions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Ghi chú xử lý" value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResolveTarget(null)}>Cancel</Button>
              <Button onClick={() => void updateStatus(resolveTarget, "resolved", action, resolutionNote).then(() => setResolveTarget(null))}>Resolve</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

