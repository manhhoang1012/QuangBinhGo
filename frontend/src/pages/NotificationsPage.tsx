import { useEffect, useState } from "react";
import { CheckCheck, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { showToast } from "@/components/common/toastStore";
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/services/notificationApi";

type FilterMode = "all" | "unread";

export function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    void getNotifications({ page: 1, limit: 50, unread_only: filter === "unread" })
      .then((response) => {
        if (mounted) setItems(response.items);
      })
      .catch(() => {
        if (mounted) setError("Không thể tải thông báo.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [filter]);

  const handleOpen = async (notification: NotificationItem) => {
    if (!notification.is_read) {
      setItems((current) => current.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)));
      await markNotificationRead(notification.id).catch(() => undefined);
    }
    if (notification.target_url) {
      navigate(notification.target_url);
    }
  };

  const handleDelete = async (notification: NotificationItem) => {
    setItems((current) => current.filter((item) => item.id !== notification.id));
    await deleteNotification(notification.id).then(() => showToast("Đã xóa thông báo.", "success")).catch(() => {
      showToast("Không thể xóa thông báo.", "error");
      setItems((current) => [notification, ...current]);
    });
  };

  const handleMarkAll = async () => {
    setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    await markAllNotificationsRead().then(() => showToast("Đã đánh dấu tất cả đã đọc.", "success")).catch(() => undefined);
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Thông báo</h1>
          <p className="text-sm text-muted-foreground">Theo dõi lượt thích, bình luận, follow và cập nhật kiểm duyệt.</p>
        </div>
        <Button className="gap-2" onClick={handleMarkAll} variant="outline">
          <CheckCheck className="h-4 w-4" />
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      <div className="mb-4 flex gap-2">
        <Button onClick={() => setFilter("all")} variant={filter === "all" ? "default" : "outline"}>
          Tất cả
        </Button>
        <Button onClick={() => setFilter("unread")} variant={filter === "unread" ? "default" : "outline"}>
          Chưa đọc
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách thông báo</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && <div className="p-4"><LoadingSkeleton count={4} className="h-20" /></div>}
          {error && !loading && <div className="p-4"><ErrorState message={error} onRetry={() => window.location.reload()} /></div>}
          {!loading && !error && items.length === 0 && <div className="p-4"><EmptyState title="Bạn chưa có thông báo nào" description="Thông báo về like, comment, follow và kiểm duyệt sẽ xuất hiện ở đây." /></div>}
          {!loading &&
            !error &&
            items.map((notification) => (
              <div className={`flex gap-3 border-t px-4 py-3 first:border-t-0 ${notification.is_read ? "" : "bg-muted/50"}`} key={notification.id}>
                <button className="min-w-0 flex-1 text-left" onClick={() => void handleOpen(notification)} type="button">
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString("vi-VN")}</p>
                </button>
                <Button aria-label="Xóa thông báo" className="h-9 w-9 p-0" onClick={() => void handleDelete(notification)} variant="ghost">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
        </CardContent>
      </Card>
    </section>
  );
}
