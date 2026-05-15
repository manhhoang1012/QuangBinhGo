import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { type AdminComment, deleteComment, getAdminComments } from "@/services/adminApi";

export function AdminCommentsPage() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setComments(await getAdminComments());
    } catch {
      setError("Could not load comments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

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

  return (
    <section>
      <AdminPageHeader description="Moderate comments across community posts." title="Comments" />
      {notice && <div className="mt-6 rounded-lg border bg-accent/10 p-4 text-sm text-accent">{notice}</div>}
      {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      {isLoading && <Card className="mt-6 h-48 animate-pulse bg-muted/60" />}
      {!isLoading && comments.length === 0 && <div className="mt-6 rounded-lg border bg-background p-8 text-center text-muted-foreground">No comments found.</div>}
      <div className="mt-6 grid gap-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="grid gap-4 pt-5 lg:grid-cols-[1fr_140px] lg:items-center">
              <div>
                <p className="text-sm text-muted-foreground">{comment.author.full_name} on {comment.post.title}</p>
                <p className="mt-1">{comment.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</p>
              </div>
              <Button onClick={() => void remove(comment)} variant="outline">Delete</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
