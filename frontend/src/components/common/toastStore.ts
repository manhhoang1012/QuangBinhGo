type ToastTone = "success" | "error" | "info";

export function showToast(message: string, tone: ToastTone = "info") {
  window.dispatchEvent(new CustomEvent("app-toast", { detail: { message, tone } }));
}

export type { ToastTone };
