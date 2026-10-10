"use client";

import { MapTrifoldIcon } from "@phosphor-icons/react";
import { useState } from "react";

/** Google Maps embed that loads only when asked, for privacy and page speed. */
export function MapEmbed({ src }: { src: string }) {
  const [open, setOpen] = useState(false);
  // Only Google Maps embed URLs are allowed (also enforced by the CSP frame-src).
  if (!/^https:\/\/www\.google\.com\/maps\/embed/.test(src)) return null;
  return (
    <div className="mt-7 overflow-hidden rounded-card border border-sky-line bg-sky">
      {open ? (
        <iframe src={src} title="Map showing our registered office" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="aspect-[4/3] w-full border-0" />
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="flex min-h-28 w-full items-center justify-center gap-2.5 px-4 font-semibold text-navy hover:text-primary">
          <MapTrifoldIcon aria-hidden weight="fill" className="size-6" />
          Show map
        </button>
      )}
    </div>
  );
}
