"use client";

import { DesktopIcon, DeviceMobileIcon, DeviceTabletIcon } from "@phosphor-icons/react";
import { AdminLink as Link } from "@/components/admin/admin-link";
import { useState } from "react";
import { cn } from "@/lib/utils";

const DEVICES = [
  { key: "phone", label: "Phone", width: 390, height: 844, Icon: DeviceMobileIcon },
  { key: "tablet", label: "Tablet", width: 768, height: 1024, Icon: DeviceTabletIcon },
  { key: "desktop", label: "Desktop", width: 1366, height: 0, Icon: DesktopIcon },
] as const;

/**
 * Shows a draft inside a frame of the chosen device width. Because the frame
 * is a real viewport of that width, the page lays out exactly as it will on
 * that kind of device.
 */
export function PreviewFrame({ src, title, editHref, published }: { src: string; title: string; editHref: string; published: boolean }) {
  const [device, setDevice] = useState<(typeof DEVICES)[number]["key"]>("phone");
  const current = DEVICES.find((d) => d.key === device)!;
  const fluid = device === "desktop";

  return (
    <div className="flex h-dvh flex-col bg-[#2b2f3a]">
      <header className="on-dark flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-navy px-3 py-2 text-white sm:px-5">
        <div className="min-w-0">
          <p className="truncate font-display font-bold">{title}</p>
          <p className="text-xs text-white/70">{published ? "This matches the live page." : "Draft preview. Visitors cannot see this until you publish."}</p>
        </div>
        <div role="group" aria-label="Preview size" className="flex rounded-full bg-white/10 p-1">
          {DEVICES.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={device === key}
              onClick={() => setDevice(key)}
              className={cn("flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold", device === key ? "bg-white text-navy" : "text-white hover:bg-white/10")}
            >
              <Icon weight="bold" className="size-4" />
              <span className={cn(device !== key && "max-sm:sr-only")}>{label}</span>
            </button>
          ))}
        </div>
        <Link href={editHref} className="btn btn-primary btn-sm">
          Back to editing
        </Link>
      </header>
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <iframe
          key={device}
          src={src}
          title={`${title} preview at ${current.label.toLowerCase()} size`}
          className={cn("mx-auto block bg-white shadow-2xl", fluid ? "h-full w-full rounded-lg" : "rounded-[1.75rem] border-[10px] border-[#11131a]")}
          style={fluid ? undefined : { width: current.width + 20, height: Math.min(current.height + 20, 2000), maxHeight: "none" }}
        />
      </div>
    </div>
  );
}
