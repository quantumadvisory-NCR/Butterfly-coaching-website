"use client";

import { CheckCircleIcon, FilePdfIcon, FilmStripIcon, ImageIcon, SpinnerGapIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { useCallback, useRef, useState } from "react";
import { type UploadKind, formatBytes, uploadKindFor } from "@/lib/media-kinds";
import { cn } from "@/lib/utils";
import { useToast } from "./toast";
import { type UploadPhase, uploadFile } from "./uploader";

export type QueueItem = {
  key: number;
  name: string;
  size: number;
  kind: UploadKind | null;
  status: "waiting" | "active" | "done" | "error";
  phase: UploadPhase;
  fraction: number;
  message?: string;
  id?: string;
};

const PARALLEL = 2;

/**
 * Uploads a batch of files two at a time, keeping a live row per file
 * (waiting, percentage, checking, done or the reason it failed).
 */
export function useUploadQueue({ onUploaded }: { onUploaded?: (ids: string[]) => void | Promise<void> } = {}) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const next = useRef(1);
  const toast = useToast();

  const update = (key: number, patch: Partial<QueueItem>) => setItems((all) => all.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  const add = useCallback(
    async (files: File[], options: { replaceId?: string } = {}) => {
      if (files.length === 0) return [];
      const batch = files.map((file) => ({
        file,
        row: {
          key: next.current++,
          name: file.name,
          size: file.size,
          kind: uploadKindFor(file),
          status: "waiting" as const,
          phase: "starting" as const,
          fraction: 0,
        },
      }));
      setItems((all) => [...all.filter((item) => item.status !== "done"), ...batch.map((b) => b.row)]);

      const ids: string[] = [];
      let failed = 0;
      let cursor = 0;
      const worker = async () => {
        while (cursor < batch.length) {
          const { file, row } = batch[cursor++]!;
          update(row.key, { status: "active" });
          const result = await uploadFile(file, {
            replaceId: options.replaceId,
            onProgress: (progress) => update(row.key, { phase: progress.phase, fraction: progress.fraction }),
          });
          if (result.ok) {
            ids.push(result.id);
            update(row.key, { status: "done", fraction: 1, id: result.id });
          } else {
            failed += 1;
            update(row.key, { status: "error", message: result.message });
          }
        }
      };
      await Promise.all(Array.from({ length: Math.min(PARALLEL, batch.length) }, worker));

      if (ids.length) await onUploaded?.(ids);
      if (ids.length && !failed) {
        toast({ tone: "success", title: ids.length === 1 ? `${batch[0]!.file.name} uploaded` : `${ids.length} files uploaded`, detail: "Ready to use across the website." });
      } else if (failed) {
        toast({ tone: "error", title: failed === batch.length ? "Upload failed" : `${failed} of ${batch.length} uploads failed`, detail: "The reason is shown beside each file." });
      }
      return ids;
    },
    [onUploaded, toast],
  );

  const clear = useCallback(() => setItems((all) => all.filter((item) => item.status === "waiting" || item.status === "active")), []);
  const busy = items.some((item) => item.status === "waiting" || item.status === "active");
  return { items, add, clear, busy };
}

const KIND_ICON = { image: ImageIcon, video: FilmStripIcon, file: FilePdfIcon } as const;

function statusText(item: QueueItem) {
  if (item.status === "done") return "Uploaded";
  if (item.status === "error") return item.message ?? "Failed";
  if (item.status === "waiting") return "Waiting";
  if (item.phase === "checking") return item.kind === "image" ? "Optimising" : "Checking";
  if (item.phase === "starting") return "Starting";
  return `${Math.round(item.fraction * 100)}%`;
}

/** The live list of uploads in progress and just finished. */
export function UploadQueue({ items, onClear, className }: { items: QueueItem[]; onClear?: () => void; className?: string }) {
  if (items.length === 0) return null;
  const finished = items.filter((item) => item.status === "done" || item.status === "error").length;
  return (
    <section aria-label="Uploads" className={cn("overflow-hidden rounded-2xl border border-line bg-surface", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <p className="text-sm font-semibold text-navy">
          {finished < items.length ? `Uploading ${items.length - finished} of ${items.length}` : `${items.length} ${items.length === 1 ? "upload" : "uploads"} finished`}
        </p>
        {onClear && finished === items.length && (
          <button type="button" onClick={onClear} className="inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold text-muted hover:bg-mist hover:text-navy">
            <XIcon aria-hidden weight="bold" className="size-3.5" />
            Clear
          </button>
        )}
      </header>
      <ul className="divide-y divide-line">
        {items.map((item) => {
          const Icon = item.kind ? KIND_ICON[item.kind] : ImageIcon;
          const working = item.status === "active" || item.status === "waiting";
          return (
            <li key={item.key} className="upload-row grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-2.5" data-status={item.status}>
              <span aria-hidden className={cn("grid size-9 place-items-center rounded-xl", item.status === "error" ? "bg-danger-soft text-danger" : "bg-mist text-navy")}>
                <Icon weight="bold" className="size-[1.125rem]" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy">{item.name}</p>
                <p className={cn("text-xs [overflow-wrap:anywhere]", item.status === "error" ? "font-semibold text-danger" : "text-muted")}>
                  {formatBytes(item.size)}
                  {formatBytes(item.size) && " · "}
                  {statusText(item)}
                </p>
                {working && (
                  <div
                    role="progressbar"
                    aria-label={`Uploading ${item.name}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(item.fraction * 100)}
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mist"
                  >
                    <div
                      className={cn("h-full rounded-full bg-accent transition-[width] duration-300 ease-out", item.phase === "checking" && "upload-shimmer")}
                      style={{ width: `${Math.max(4, item.fraction * 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <span aria-hidden className="grid size-6 place-items-center">
                {item.status === "done" ? (
                  <CheckCircleIcon weight="fill" className="size-6 text-success" />
                ) : item.status === "error" ? (
                  <WarningCircleIcon weight="fill" className="size-6 text-danger" />
                ) : (
                  <SpinnerGapIcon weight="bold" className="size-5 animate-spin text-muted" />
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
