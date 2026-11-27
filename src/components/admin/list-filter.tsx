"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useEffect, useId, useState } from "react";

/**
 * A search box that filters the rows of a server-rendered <RecordTable id={target}>
 * as you type, with a live count. Rows stay in the page, so nothing is fetched.
 */
export function ListFilter({ target, noun }: { target: string; noun: string }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState<{ visible: number; total: number } | null>(null);

  useEffect(() => {
    const table = document.getElementById(target);
    if (!table) return;
    const rows = Array.from(table.querySelectorAll<HTMLElement>("[data-filter-row]"));
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const row of rows) {
      const text = (row.textContent ?? "").toLowerCase();
      const match = words.every((word) => text.includes(word));
      row.hidden = !match;
      if (match) visible += 1;
    }
    const empty = table.querySelector<HTMLElement>("[data-filter-empty]");
    if (empty) empty.hidden = visible > 0 || rows.length === 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the count comes from the page's rows
    setShown({ visible, total: rows.length });
  }, [query, target]);

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative sm:w-80">
        <MagnifyingGlassIcon aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <label htmlFor={id} className="sr-only">
          Search {noun}
        </label>
        <input id={id} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${noun}`} className="field-input min-h-11 pl-10" />
      </div>
      {shown && (
        <p role="status" className="text-sm text-muted tabular-nums">
          {query.trim() ? `${shown.visible} of ${shown.total} ${noun}` : `${shown.total} ${noun}`}
        </p>
      )}
    </div>
  );
}
