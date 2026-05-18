import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center text-destructive">
      <AlertTriangle className="mx-auto h-8 w-8" />
      <p className="mt-3 font-medium">{message}</p>
      {onRetry && <Button className="mt-4" onClick={onRetry} variant="outline">Thử lại</Button>}
    </div>
  );
}
