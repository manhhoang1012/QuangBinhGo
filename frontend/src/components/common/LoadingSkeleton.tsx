import { Card } from "@/components/ui/card";

export function LoadingSkeleton({ count = 1, className = "h-40", grid = false }: { count?: number; className?: string; grid?: boolean }) {
  const items = Array.from({ length: count });
  return (
    <div className={grid ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-4"}>
      {items.map((_, index) => (
        <Card className={`${className} animate-pulse bg-muted/60`} key={index} />
      ))}
    </div>
  );
}

export function PostSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 h-56 animate-pulse rounded-md bg-muted" />
      <div className="mt-4 space-y-2">
        <div className="h-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </Card>
  );
}
