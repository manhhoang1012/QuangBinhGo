import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createReport, type ReportReason, type ReportTargetType } from "@/services/reportApi";
import { authStorage } from "@/services/api";
import { showToast } from "@/components/common/toastStore";

const reasons: Array<{ value: ReportReason; label: string }> = [
  { value: "spam", label: "Spam" },
  { value: "offensive", label: "Nội dung phản cảm" },
  { value: "harassment", label: "Quấy rối" },
  { value: "false_info", label: "Sai sự thật" },
  { value: "scam", label: "Lừa đảo" },
  { value: "inappropriate", label: "Không phù hợp" },
  { value: "other", label: "Khác" },
];

export function ReportModal({ targetType, targetId, isOpen, onClose, onSuccess }: { targetType: ReportTargetType; targetId: number; isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const submit = async () => {
    if (!authStorage.getToken()) {
      setError("Vui lòng đăng nhập để báo cáo nội dung.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await createReport({ target_type: targetType, target_id: targetId, reason, detail: detail.trim() || undefined });
      showToast("Đã gửi báo cáo. Cảm ơn bạn đã giúp cộng đồng an toàn hơn.", "success");
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const response = err as { response?: { data?: { detail?: unknown } } };
      const rawMessage = response.response?.data?.detail;
      const message = typeof rawMessage === "string" ? rawMessage : "Khong the gui bao cao.";
      setError(Array.isArray(rawMessage) ? "Thong tin bao cao chua hop le." : message);
      showToast(Array.isArray(rawMessage) ? "Thong tin bao cao chua hop le." : message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-lg border bg-background p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Báo cáo nội dung</h2>
            <p className="mt-1 text-sm text-muted-foreground">Chọn lý do để đội ngũ quản trị kiểm tra nội dung này.</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground" onClick={onClose} type="button">×</button>
        </div>
        <div className="mt-4 space-y-3">
          <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={reason} onChange={(event) => setReason(event.target.value as ReportReason)}>
            {reasons.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <textarea className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Chi tiết thêm (không bắt buộc)" value={detail} onChange={(event) => setDetail(event.target.value)} />
          {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Hủy</Button>
          <Button onClick={() => void submit()} disabled={isSubmitting}>{isSubmitting ? "Đang gửi..." : "Gửi báo cáo"}</Button>
        </div>
      </div>
    </div>
  );
}


