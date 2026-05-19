import { api, type User } from "@/services/api";

export type ReportTargetType = "post" | "comment" | "user" | "review";
export type ReportReason = "spam" | "offensive" | "harassment" | "false_info" | "scam" | "inappropriate" | "other";

export interface ReportRead {
  id: number;
  type: ReportTargetType;
  target_type: ReportTargetType;
  target_id: number;
  target_label: string;
  target_author?: User | null;
  reporter?: User | null;
  reason: ReportReason;
  detail?: string | null;
  status: "pending" | "resolved" | "rejected";
  resolved_by?: number | null;
  resolved_at?: string | null;
  resolution_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportList {
  items: ReportRead[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export function createReport(data: { target_type: ReportTargetType; target_id: number; reason: ReportReason; detail?: string }) {
  return api.post<ReportRead>("/reports", data).then((response) => response.data);
}

export function getAdminReports(params: { type?: string; target_type?: string; status?: string; reason?: string; page?: number; limit?: number } = {}) {
  return api.get<ReportList>("/admin/reports", { params }).then((response) => response.data);
}

export function getAdminReport(id: number) {
  return api.get<ReportRead>(`/admin/reports/${id}`).then((response) => response.data);
}

export function resolveReport(id: number, data: { action: "none" | "hide_content" | "delete_content" | "warn_user" | "block_user"; resolution_note?: string; notify_user?: boolean }) {
  return api.patch<ReportRead>(`/admin/reports/${id}/resolve`, data).then((response) => response.data);
}

export function rejectReport(id: number, data: { resolution_note?: string }) {
  return api.patch<ReportRead>(`/admin/reports/${id}/reject`, data).then((response) => response.data);
}
