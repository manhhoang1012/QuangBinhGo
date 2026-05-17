import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { type AdminComment, deleteComment, getAdminComments, updateCommentStatus } from "@/services/adminApi";

export function AdminCommentsPage() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setComments(await getAdminComments({ status: statusFilter || undefined }));
    } catch {
      setError("Could not load comments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, [statusFilter]);

  const remove = async (comment: AdminComment) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment(comment.id);
      setNotice("Comment deleted.");
      await load();
    } catch {
      setError("Could not delete comment.");
    }
  };

  const changeStatus = async (comment: AdminComment, status: "visible" | "hidden" | "deleted" | "spam") => {
    try {
      await updateCommentStatus(comment.id, status);
      setNotice("Comment status updated.");
      await load();
    } catch {
      setError("Could not update comment status.");
    }
  };

  return (
    <section>
      <AdminPageHeader description="Moderate comments across community posts." title="Comments" />
      {notice && <div className="mt-6 rounded-lg border bg-accent/10 p-4 text-sm text-accent">{notice}</div>}
      {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      <div className="mt-6">
        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All comments</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
          <option value="spam">Spam</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>
      {isLoading && <Card className="mt-6 h-48 animate-pulse bg-muted/60" />}
      {!isLoading && comments.length === 0 && <div className="mt-6 rounded-lg border bg-background p-8 text-center text-muted-foreground">No comments found.</div>}
      <div className="mt-6 grid gap-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="grid gap-4 pt-5 lg:grid-cols-[1fr_140px] lg:items-center">
              <div>
                <p className="text-sm text-muted-foreground">{comment.author.full_name} on {comment.post.title}</p>
                <p className="mt-1">{comment.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">{comment.status} - {comment.report_count} reports - {comment.like_count} likes - {new Date(comment.created_at).toLocaleString()}</p>
                {comment.reports?.length > 0 && (
                  <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                    {comment.reports.map((report) => <p key={report.id}>{report.reason}: {report.detail || "No detail"}</p>)}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void changeStatus(comment, "hidden")} variant="outline">Hide</Button>
                <Button onClick={() => void changeStatus(comment, "visible")} variant="outline">Show</Button>
                <Button onClick={() => void remove(comment)} variant="outline">Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
