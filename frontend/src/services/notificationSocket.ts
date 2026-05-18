import { authStorage } from "@/services/api";
import type { NotificationItem } from "@/services/notificationApi";

export interface NotificationSocketPayload {
  event: "notification:new" | "notification:read" | "pong" | string;
  notification?: NotificationItem;
  notification_id?: number | null;
  unread_count?: number;
}

export interface NotificationSocketHandlers {
  onMessage: (payload: NotificationSocketPayload) => void;
  onError?: () => void;
}

function getWebSocketUrl(token: string) {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
  const wsBase = apiBase.replace(/^http/, "ws").replace(/\/$/, "");
  return `${wsBase}/ws/notifications?token=${encodeURIComponent(token)}`;
}

export function createNotificationSocket({ onMessage, onError }: NotificationSocketHandlers) {
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let closedByClient = false;

  const connect = () => {
    const token = authStorage.getToken();
    if (!token || closedByClient) {
      return;
    }

    socket = new WebSocket(getWebSocketUrl(token));
    socket.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data) as NotificationSocketPayload);
      } catch {
        onError?.();
      }
    };
    socket.onerror = () => onError?.();
    socket.onclose = () => {
      socket = null;
      if (!closedByClient && authStorage.getToken()) {
        reconnectTimer = window.setTimeout(connect, 3000);
      }
    };
  };

  connect();

  return {
    disconnect() {
      closedByClient = true;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
      socket = null;
    },
  };
}
