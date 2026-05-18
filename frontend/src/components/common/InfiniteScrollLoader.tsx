import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";

export function InfiniteScrollLoader({ isLoading, hasMore }: { isLoading: boolean; hasMore: boolean }) {
  if (isLoading) return <LoadingSkeleton className="h-28" />;
  if (!hasMore) return <p className="py-4 text-center text-sm text-muted-foreground">Đã hiển thị hết.</p>;
  return null;
}
