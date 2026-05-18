import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span className="inline-flex items-center gap-1" key={`${item.label}-${index}`}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {item.to ? <Link className="hover:text-foreground" to={item.to}>{item.label}</Link> : <span className="text-foreground">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
