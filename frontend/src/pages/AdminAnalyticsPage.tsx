import { useEffect, useState } from "react";
import { Eye, FileSearch, MapPinned, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminPageHeader } from "@/layouts/AdminLayout";
import { getAdminAnalyticsSummary, getAdminSearchLogs, type AnalyticsSummary, type SearchLogRead } from "@/services/analyticsApi";

export function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [searches, setSearches] = useState<SearchLogRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryData, searchData] = await Promise.all([getAdminAnalyticsSummary(), getAdminSearchLogs({ limit: 10 })]);
      setSummary(summaryData);
      setSearches(searchData);
    } catch {
      setError("Không thể tải analytics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (isLoading) return <LoadingSkeleton count={4} className="h-32" grid />;
  if (error || !summary) return <ErrorState message={error ?? "Không có dữ liệu analytics."} onRetry={() => void load()} />;

  const cards = [
    { label: "Lượt xem địa điểm", value: summary.total_place_views, icon: MapPinned },
    { label: "Lượt xem bài viết", value: summary.total_post_views, icon: MessageSquare },
    { label: "Lượt xem hôm nay", value: summary.views_today, icon: Eye },
    { label: "Tìm kiếm hôm nay", value: summary.searches_today, icon: FileSearch },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Analytics" description="Theo dõi lượt xem, tìm kiếm và nội dung đang được quan tâm." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="flex items-center justify-between pt-5">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{card.value}</p>
                </div>
                <Icon className="h-8 w-8 text-primary" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Views by day</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {summary.views_by_day.length === 0 && <EmptyState title="Chưa có lượt xem" />}
            {summary.views_by_day.map((item) => <MetricRow key={item.date} label={item.date} value={item.count} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Searches by day</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {summary.searches_by_day.length === 0 && <EmptyState title="Chưa có lượt tìm kiếm" />}
            {summary.searches_by_day.map((item) => <MetricRow key={item.date} label={item.date} value={item.count} />)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Top places</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {summary.top_places.map((place) => (
              <Link className="block rounded-md border p-3 hover:bg-muted/40" key={place.id} to={`/places/${place.slug || place.id}`}>
                <p className="font-medium">{place.name}</p>
                <p className="text-sm text-muted-foreground">{place.view_count ?? 0} lượt xem</p>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top posts</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {summary.top_posts.map((post) => (
              <Link className="block rounded-md border p-3 hover:bg-muted/40" key={post.id} to={`/community/${post.slug || post.id}`}>
                <p className="font-medium">{post.title || "Bài viết cộng đồng"}</p>
                <p className="text-sm text-muted-foreground">{post.view_count ?? 0} lượt xem · {post.likes_count} likes</p>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Popular keywords</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {summary.popular_keywords.length === 0 && <EmptyState title="Chưa có từ khóa" />}
            {summary.popular_keywords.map((keyword) => <MetricRow key={keyword.keyword} label={keyword.keyword} value={keyword.count} />)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Search logs</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b text-left text-muted-foreground"><th className="py-2">Query</th><th>Type</th><th>Results</th><th>User</th><th>Time</th></tr></thead>
            <tbody>
              {searches.map((row) => (
                <tr className="border-b" key={row.id}>
                  <td className="py-3">{row.query}</td>
                  <td>{row.search_type}</td>
                  <td>{row.result_count}</td>
                  <td>{row.user?.username ?? "anonymous"}</td>
                  <td>{new Date(row.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
      <span className="truncate text-sm">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
