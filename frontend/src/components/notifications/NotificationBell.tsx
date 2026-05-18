import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import type { User } from "@/services/api";
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/services/notificationApi";
import { createNotificationSocket } from "@/services/notificationSocket";

interface NotificationBellProps {
  user: User | null;
}

export function NotificationBell({ user }: NotificationBellProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setUnreadCount(0);
      return;
    }

    let mounted = true;
    setLoading(true);
    void Promise.all([getNotifications({ page: 1, limit: 8 }), getUnreadNotificationCount()])
      .then(([list, count]) => {
        if (!mounted) return;
        setItems(list.items);
        setUnreadCount(count);
      })
      .catch(() => {
        if (mounted) setItems([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const socket = createNotificationSocket({
      onMessage(payload) {
        if (payload.event === "notification:new" && payload.notification) {
          setItems((current) => [payload.notification!, ...current.filter((item) => item.id !== payload.notification!.id)].slice(0, 8));
          if (typeof payload.unread_count === "number") {
            setUnreadCount(payload.unread_count);
          } else {
            setUnreadCount((count) => count + 1);
          }
          setToastMessage("Bạn có thông báo mới");
          window.setTimeout(() => setToastMessage(null), 2500);
        }
        if (payload.event === "notification:read" && typeof payload.unread_count === "number") {
          setUnreadCount(payload.unread_count);
          if (payload.notification_id) {
            setItems((current) => current.map((item) => (item.id === payload.notification_id ? { ...item, is_read: true } : item)));
          } else {
            setItems((current) => current.map((item) => ({ ...item, is_read: true })));
          }
        }
      },
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, [user]);

  const label = useMemo(() => (unreadCount > 99 ? "99+" : String(unreadCount)), [unreadCount]);

  if (!user) {
    return null;
  }

  const handleOpenNotification = async (notification: NotificationItem) => {
    if (!notification.is_read) {
      setItems((current) => current.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)));
      setUnreadCount((count) => Math.max(0, count - 1));
      try {
        await markNotificationRead(notification.id);
      } catch {
        setUnreadCount((count) => count + 1);
      }
    }
    setOpen(false);
    if (notification.target_url) {
      navigate(notification.target_url);
    }
  };

  const handleMarkAll = async () => {
    setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      const count = await getUnreadNotificationCount().catch(() => 0);
      setUnreadCount(count);
    }
  };

  const handleDelete = async (notification: NotificationItem) => {
    setItems((current) => current.filter((item) => item.id !== notification.id));
    if (!notification.is_read) {
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    await deleteNotification(notification.id).catch(() => {
      setItems((current) => [notification, ...current].slice(0, 8));
      if (!notification.is_read) setUnreadCount((count) => count + 1);
    });
  };

  return (
    <div className="relative">
      <Button aria-label="Thông báo" className="relative h-10 w-10 rounded-full p-0" onClick={() => setOpen((value) => !value)} variant="outline">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white">
            {label}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-1rem)] rounded-md border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <p className="font-medium">Thông báo</p>
            <button className="text-xs text-primary hover:underline" onClick={handleMarkAll} type="button">
              Đánh dấu đã đọc
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto py-1">
            {loading && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Đang tải thông báo...</p>}
            {!loading && items.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Bạn chưa có thông báo nào.</p>}
            {items.map((notification) => (
              <div className={`flex gap-2 px-3 py-2 ${notification.is_read ? "" : "bg-muted/60"}`} key={notification.id}>
                <button className="min-w-0 flex-1 text-left" onClick={() => void handleOpenNotification(notification)} type="button">
                  <p className="truncate text-sm font-medium">{notification.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatNotificationTime(notification.created_at)}</p>
                </button>
                <button aria-label="Xóa thông báo" className="self-start rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => void handleDelete(notification)} type="button">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="border-t p-2">
            <Link className="block rounded-md px-3 py-2 text-center text-sm hover:bg-muted" onClick={() => setOpen(false)} to="/notifications">
              Xem tất cả
            </Link>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-lg">
          <CheckCheck className="h-4 w-4 text-primary" />
          {toastMessage}
        </div>
      )}
    </div>
  );
}

function formatNotificationTime(value: string) {
  const timestamp = new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return new Date(value).toLocaleDateString("vi-VN");
}
