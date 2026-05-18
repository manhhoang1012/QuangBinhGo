import { Button } from "@/components/ui/button";

export function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages?: number; onPageChange: (page: number) => void }) {
  const canNext = totalPages ? page < totalPages : true;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))} variant="outline">Trước</Button>
      <span className="rounded-md border px-3 py-2 text-sm">Trang {page}{totalPages ? ` / ${totalPages}` : ""}</span>
      <Button disabled={!canNext} onClick={() => onPageChange(page + 1)} variant="outline">Tiếp</Button>
    </div>
  );
}
