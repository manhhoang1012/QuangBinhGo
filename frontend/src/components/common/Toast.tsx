import { useEffect, useState } from "react";

import { type ToastTone } from "@/components/common/toastStore";

interface ToastMessage {
  id: number;
  message: string;
  tone: ToastTone;
}

export function ToastViewport() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; tone?: ToastTone }>).detail;
      const toast = { id: Date.now() + Math.random(), message: detail.message, tone: detail.tone ?? "info" };
      setToasts((current) => [...current.slice(-3), toast]);
      window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== toast.id)), 3500);
    };
    window.addEventListener("app-toast", handler);
    return () => window.removeEventListener("app-toast", handler);
  }, []);

  return (
    <div className="fixed right-4 top-20 z-[90] grid w-[min(360px,calc(100vw-2rem))] gap-2">
      {toasts.map((toast) => (
        <div
          className={`rounded-md border p-3 text-sm shadow-lg ${
            toast.tone === "error" ? "border-destructive/30 bg-destructive text-destructive-foreground" : toast.tone === "success" ? "bg-accent text-accent-foreground" : "bg-background"
          }`}
          key={toast.id}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
