import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { getModerationReports, hideComment, hidePost, rejectReport, resolveReport, type ModerationReport, warnUser } from "@/services/moderationApi";

export function ModerationReportsPage() {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("violation");
  const [warningMessage, setWarningMessage] = useState("Nội dung của bạn vi phạm quy định cộng đồng. Vui lòng điều chỉnh trong các lần đăng tiếp theo.");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getModerationReports({ type: type || undefined, status: status || undefined, limit: 100 });
      setReports(response.items);
    } catch {
      setError("Could not load reports.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, [type, status]);

  const resolve = async (report: ModerationReport) => {
    try {
      await resolveReport(report.id, { type: report.type, reason });
      setNotice("Report resolved.");
      await load();
    } catch {
      setError("Could not resolve report.");
    }
  };

  const reject = async (report: ModerationReport) => {
    try {
      await rejectReport(report.id, { type: report.type, reason });
      setNotice("Report rejected.");
      await load();
    } catch {
      setError("Could not reject report.");
    }
  };

  const hideTarget = async (report: ModerationReport) => {
    try {
      if (report.type === "post") await hidePost(report.target_id, { reason });
      if (report.type === "comment") await hideComment(report.target_id, { reason });
      if (report.type === "review") {
        setError("Review hiding is available from the Reviews moderation page.");
        return;
      }
      setNotice("Target hidden.");
      await load();
    } catch {
      setError("Could not hide target.");
    }
  };

  const warn = async (report: ModerationReport) => {
    if (!report.target_author?.id) {
      setError("Target author is missing.");
      return;
    }
    try {
      await warnUser(report.target_author.id, { reason: "other", message: warningMessage, related_target_type: report.type, related_target_id: report.target_id });
      setNotice("Warning sent.");
    } catch {
      setError("Could not warn this user.");
    }
  };

  return (
    <section>
      <AdminPageHeader description="Review, resolve, reject, hide targets, and warn users." title="Moderation reports" />
      {notice && <div className="mt-6 rounded-lg border bg-accent/10 p-4 text-sm text-accent">{notice}</div>}
      {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      <div className="mt-6 grid gap-2 lg:grid-cols-[150px_160px_180px_1fr_auto]">
        <select className="rounded-md border bg-background px-3 py-2 text-sm" onChange={(event) => setType(event.target.value)} value={type}>
          <option value="">All types</option>
          <option value="post">Posts</option>
          <option value="comment">Comments</option>
          <option value="review">Reviews</option>
        </select>
        <select className="rounded-md border bg-background px-3 py-2 text-sm" onChange={(event) => setStatus(event.target.value)} value={status}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
        <Input onChange={(event) => setReason(event.target.value)} placeholder="Reason" value={reason} />
        <Input onChange={(event) => setWarningMessage(event.target.value)} placeholder="Warning message" value={warningMessage} />
        <Button onClick={() => void load()} variant="outline">Refresh</Button>
      </div>
      {isLoading && <Card className="mt-6 h-48 animate-pulse bg-muted/60" />}
      {!isLoading && reports.length === 0 && <div className="mt-6 rounded-lg border bg-background p-8 text-center text-muted-foreground">No reports found.</div>}
      <div className="mt-6 grid gap-4">
        {reports.map((report) => (
          <Card key={`${report.type}-${report.id}`}>
            <CardContent className="grid gap-4 pt-5 xl:grid-cols-[1fr_360px] xl:items-center">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-muted px-2 py-1 text-xs uppercase">{report.type}</span>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">{report.status}</span>
                </div>
                <p className="mt-3 font-medium">{report.target_label}</p>
                <p className="mt-1 text-sm text-muted-foreground">Reporter: {report.reporter?.full_name ?? "Unknown"} - Target user: {report.target_author?.full_name ?? "Unknown"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{report.reason}{report.detail ? ` - ${report.detail}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void resolve(report)} variant="outline">Resolve</Button>
                <Button onClick={() => void reject(report)} variant="outline">Reject</Button>
                <Button onClick={() => void hideTarget(report)} variant="outline">Hide target</Button>
                <Button onClick={() => void warn(report)} variant="outline">Warn user</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
