import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmptyState({ title, description, actionLabel, onAction }: { title: string; description?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-8 text-center">
      <SearchX className="mx-auto h-10 w-10 text-muted-foreground" />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>}
      {actionLabel && onAction && <Button className="mt-4" onClick={onAction} variant="outline">{actionLabel}</Button>}
    </div>
  );
}
