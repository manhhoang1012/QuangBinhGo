import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { getReportedComments, hideComment, unhideComment, warnUser } from "@/services/moderationApi";

interface CommentReportRow {
  id: number;
  reason: string;
  detail?: string | null;
  status: string;
  comment: {
    id: number;
    content: string;
    status?: string;
    user_id?: number;
    author?: { id: number; full_name: string };
  };
  reporter?: { full_name: string } | null;
  created_at: string;
}

export function ModerationCommentsPage() {
  const [reports, setReports] = useState<CommentReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setReports(await getReportedComments({ status: "open" }));
    } catch {
      setError("Could not load reported comments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const toggleHidden = async (row: CommentReportRow) => {
    try {
      if (row.comment.status === "hidden") await unhideComment(row.comment.id, { reason: "reviewed" });
      else await hideComment(row.comment.id, { reason: row.reason || "violation", note: row.detail });
      setNotice("Comment moderation status updated.");
      await load();
    } catch {
      setError("Could not update comment.");
    }
  };

  const warn = async (row: CommentReportRow) => {
    const userId = row.comment.author?.id ?? row.comment.user_id;
    if (!userId) {
      setError("Comment author is missing.");
      return;
    }
    try {
      await warnUser(userId, { reason: "other", message: "Bình luận của bạn đã bị báo cáo và cần tuân thủ quy định cộng đồng.", related_target_type: "comment", related_target_id: row.comment.id });
      setNotice("Warning sent.");
    } catch {
      setError("Could not warn this user.");
    }
  };

  return (
    <section>
      <AdminPageHeader description="Review reported comments and hide harmful content." title="Reported comments" />
      {notice && <div className="mt-6 rounded-lg border bg-accent/10 p-4 text-sm text-accent">{notice}</div>}
      {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      {isLoading && <Card className="mt-6 h-48 animate-pulse bg-muted/60" />}
      {!isLoading && reports.length === 0 && <div className="mt-6 rounded-lg border bg-background p-8 text-center text-muted-foreground">No reported comments.</div>}
      <div className="mt-6 grid gap-4">
        {reports.map((row) => (
          <Card key={row.id}>
            <CardContent className="grid gap-4 pt-5 lg:grid-cols-[1fr_220px] lg:items-center">
              <div>
                <p className="text-sm text-muted-foreground">{row.comment.author?.full_name ?? "Unknown"} - {row.comment.status ?? "visible"}</p>
                <p className="mt-1">{row.comment.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">Report: {row.reason}{row.detail ? ` - ${row.detail}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void toggleHidden(row)} variant="outline">{row.comment.status === "hidden" ? "Unhide" : "Hide"}</Button>
                <Button onClick={() => void warn(row)} variant="outline">Warn user</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
