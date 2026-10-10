import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { Crumb } from "@/components/blocks/types";
import { cn } from "@/lib/utils";

/** Breadcrumb trail. The matching BreadcrumbList structured data is emitted by the page. */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted">
        <li className="flex items-center gap-1.5">
          <Link href="/" className="inline-flex min-h-11 items-center font-medium text-navy underline-offset-4 hover:underline">
            Home
          </Link>
        </li>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1.5">
              <CaretRightIcon aria-hidden className="size-3.5 text-muted" />
              {last ? (
                <span aria-current="page" className="inline-flex min-h-11 items-center text-ink">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="inline-flex min-h-11 items-center font-medium text-navy underline-offset-4 hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
