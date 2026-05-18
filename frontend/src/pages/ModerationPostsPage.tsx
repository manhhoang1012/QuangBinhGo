import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { getReportedPosts, hidePost, unhidePost, warnUser } from "@/services/moderationApi";

interface PostReportRow {
  id: number;
  reason: string;
  description?: string | null;
  status: string;
  post: {
    id: number;
    title: string;
    content: string;
    status?: string;
    author: { id: number; full_name: string };
    likes_count: number;
    comments_count: number;
  };
  reporter?: { full_name: string } | null;
  created_at: string;
}

export function ModerationPostsPage() {
  const [reports, setReports] = useState<PostReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setReports(await getReportedPosts({ status: "open" }));
    } catch {
      setError("Could not load reported posts.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const toggleHidden = async (row: PostReportRow) => {
    try {
      if (row.post.status === "hidden") await unhidePost(row.post.id, { reason: "reviewed" });
      else await hidePost(row.post.id, { reason: row.reason || "violation", note: row.description });
      setNotice("Post moderation status updated.");
      await load();
    } catch {
      setError("Could not update post.");
    }
  };

  const warn = async (row: PostReportRow) => {
    try {
      await warnUser(row.post.author.id, { reason: "other", message: "Bài viết của bạn đã bị báo cáo và cần tuân thủ quy định cộng đồng.", related_target_type: "post", related_target_id: row.post.id });
      setNotice("Warning sent.");
    } catch {
      setError("Could not warn this user.");
    }
  };

  return (
    <section>
      <AdminPageHeader description="Review reported posts and take non-destructive moderation actions." title="Reported posts" />
      {notice && <div className="mt-6 rounded-lg border bg-accent/10 p-4 text-sm text-accent">{notice}</div>}
      {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      {isLoading && <Card className="mt-6 h-48 animate-pulse bg-muted/60" />}
      {!isLoading && reports.length === 0 && <div className="mt-6 rounded-lg border bg-background p-8 text-center text-muted-foreground">No reported posts.</div>}
      <div className="mt-6 grid gap-4">
        {reports.map((row) => (
          <Card key={row.id}>
            <CardContent className="grid gap-4 pt-5 lg:grid-cols-[1fr_220px] lg:items-center">
              <div>
                <p className="font-medium">{row.post.title}</p>
                <p className="text-sm text-muted-foreground">{row.post.author.full_name} - {row.post.status ?? "visible"} - {row.post.likes_count} likes - {row.post.comments_count} comments</p>
                <p className="mt-1 line-clamp-2 text-sm">{row.post.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">Report: {row.reason}{row.description ? ` - ${row.description}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void toggleHidden(row)} variant="outline">{row.post.status === "hidden" ? "Unhide" : "Hide"}</Button>
                <Button onClick={() => void warn(row)} variant="outline">Warn user</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
