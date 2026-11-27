"use client";

import {
  ArrowSquareOutIcon,
  ArrowsClockwiseIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  SortAscendingIcon,
  TrashIcon,
  UploadSimpleIcon,
  WarningIcon,
  XIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { type DragEvent, memo, useMemo, useRef, useState, useTransition } from "react";
import { type MediaView, deleteMediaAction, listMediaAction, mediaUsageAction, updateMediaAction } from "@/app/admin/actions/operations";
import { AdminLink as Link } from "@/components/admin/admin-link";
import type { MediaUsage } from "@/lib/admin/media-store";
import { ACCEPT, ACCEPT_ALL, KIND_NOUN, UPLOAD_LIMITS, formatBytes } from "@/lib/media-kinds";
import { cn } from "@/lib/utils";
import { MediaThumb } from "./media-picker";
import { useToast } from "./toast";
import { Notice } from "./ui";
import { UploadQueue, useUploadQueue } from "./upload-queue";

const SOURCES = [
  { value: "bca", label: "Authentic BCA photograph or asset" },
  { value: "stock", label: "Licensed stock" },
  { value: "ai", label: "AI-generated" },
  { value: "upload", label: "Uploaded (not yet classified)" },
] as const;

const FILTERS = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "file", label: "PDFs" },
  { value: "bca", label: "BCA" },
  { value: "ai", label: "AI-generated" },
  { value: "stock", label: "Stock" },
  { value: "no-alt", label: "Missing alt text" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

const SORTS = [
  { value: "new", label: "Newest first" },
  { value: "old", label: "Oldest first" },
  { value: "name", label: "Name" },
  { value: "size", label: "Largest first" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

function matches(item: MediaView, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "image" || filter === "video" || filter === "file") return item.kind === filter;
  if (filter === "no-alt") return item.kind === "image" && !item.alt;
  return item.source === filter;
}

const LIMITS = `Images up to ${UPLOAD_LIMITS.image / 1024 / 1024} MB, PDFs up to ${UPLOAD_LIMITS.file / 1024 / 1024} MB, MP4 or WebM videos up to ${UPLOAD_LIMITS.video / 1024 / 1024} MB.`;

export function MediaLibrary({ initial, canDelete, initialQuery = "" }: { initial: MediaView[]; canDelete: boolean; initialQuery?: string }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("new");
  const [selected, setSelected] = useState<MediaView | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const refresh = async () => {
    const result = await listMediaAction();
    if (result.ok) setItems(result.items);
    router.refresh();
    return result.ok ? result.items : items;
  };

  const queue = useUploadQueue({
    onUploaded: async (ids) => {
      setFresh(new Set(ids));
      setFilter("all");
      setSort("new");
      await refresh();
    },
  });

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.value, items.filter((item) => matches(item, f.value)).length])) as Record<Filter, number>, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((item) => matches(item, filter) && (!q || `${item.filename} ${item.alt} ${item.caption ?? ""} ${item.credit ?? ""}`.toLowerCase().includes(q)));
    const by = {
      new: (a: MediaView, b: MediaView) => b.createdAt.localeCompare(a.createdAt),
      old: (a: MediaView, b: MediaView) => a.createdAt.localeCompare(b.createdAt),
      name: (a: MediaView, b: MediaView) => (a.alt || a.filename).localeCompare(b.alt || b.filename),
      size: (a: MediaView, b: MediaView) => (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0),
    }[sort];
    return [...list].sort(by);
  }, [items, query, filter, sort]);

  const filesFrom = (event: DragEvent) => Array.from(event.dataTransfer.files ?? []);
  const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer.types ?? []).includes("Files");

  return (
    <div
      className="relative"
      onDragEnter={(event) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => hasFiles(event) && event.preventDefault()}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragging(false);
      }}
      onDrop={(event) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        void queue.add(filesFrom(event));
      }}
    >
      {/* Upload panel: drop files anywhere on the library, or choose them. */}
      <div className="admin-dropzone mb-5 flex flex-col gap-4 rounded-3xl border border-dashed border-[#cfcdc6] bg-[linear-gradient(135deg,#ffffff,#f7f5ef)] p-4 sm:flex-row sm:items-center sm:p-5">
        <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-navy text-accent shadow-[0_10px_24px_-10px_rgb(0_0_0/0.5)]">
          <CloudArrowUpIcon weight="duotone" className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-navy">Drop images, videos or PDFs here to upload</p>
          <p className="text-sm text-muted">{LIMITS}</p>
        </div>
        <input
          id="media-upload"
          type="file"
          multiple
          accept={ACCEPT_ALL}
          className="sr-only"
          onChange={(event) => {
            void queue.add(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
        <label htmlFor="media-upload" className={cn("btn btn-primary btn-sm cursor-pointer self-start sm:self-auto", queue.busy && "opacity-80")}>
          <UploadSimpleIcon weight="bold" className="size-4" />
          {queue.busy ? "Uploading" : "Upload files"}
        </label>
      </div>

      <UploadQueue items={queue.items} onClear={queue.clear} className="mb-5" />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <label htmlFor="media-search" className="sr-only">
            Search media
          </label>
          <input id="media-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or description" className="field-input pl-10" />
        </div>
        <div className="relative md:w-52">
          <SortAscendingIcon aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <label htmlFor="media-sort" className="sr-only">
            Sort media
          </label>
          <select id="media-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field-input pl-10">
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div role="group" aria-label="Filter media" className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors",
              filter === option.value ? "bg-navy text-white" : "border border-line bg-surface text-navy hover:border-navy",
              option.value === "no-alt" && counts["no-alt"] > 0 && filter !== option.value && "border-danger/40 text-danger",
            )}
          >
            {option.label}
            <span className={cn("rounded-full px-1.5 text-xs tabular-nums", filter === option.value ? "bg-white/15" : "bg-mist")}>{counts[option.value]}</span>
          </button>
        ))}
      </div>

      <p className="sr-only" role="status">
        {visible.length} {visible.length === 1 ? "item" : "items"} shown
      </p>

      {visible.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-surface px-6 py-12 text-center text-muted">Nothing here yet. Upload a file or change the filter.</p>
      ) : (
        <MediaGrid items={visible} fresh={fresh} onSelect={setSelected} />
      )}

      {dragging && (
        <div aria-hidden className="admin-drop-overlay pointer-events-none fixed inset-0 z-[var(--z-overlay)] grid place-items-center bg-[#141414]/55 p-6 backdrop-blur-sm">
          <div className="grid justify-items-center gap-3 rounded-3xl border-2 border-dashed border-accent bg-[#1b1b1b]/90 px-10 py-12 text-center text-white">
            <CloudArrowUpIcon weight="duotone" className="size-14 text-accent" />
            <p className="font-display text-2xl">Drop to upload</p>
            <p className="text-sm text-white/70">{LIMITS}</p>
          </div>
        </div>
      )}

      {selected && (
        <MediaEditor
          key={selected.id + selected.url}
          item={selected}
          canDelete={canDelete}
          onClose={() => setSelected(null)}
          onChanged={async (next) => {
            await refresh();
            setSelected(next);
          }}
        />
      )}
    </div>
  );
}

/**
 * The tiles, kept apart from the library's other state so a running upload's
 * progress bar does not redraw every tile on each update.
 */
const MediaGrid = memo(function MediaGrid({ items, fresh, onSelect }: { items: MediaView[]; fresh: Set<string>; onSelect: (item: MediaView) => void }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <li key={item.id} className={cn(fresh.has(item.id) && "admin-fresh")}>
          <button
            type="button"
            onClick={() => onSelect(item)}
            className="admin-tile group block w-full overflow-hidden rounded-2xl border border-line bg-surface text-left transition-[border-color,box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:border-navy/30 hover:shadow-card"
          >
            <MediaThumb item={item} className="aspect-[4/3] w-full" sizes="(min-width: 80rem) 200px, (min-width: 48rem) 24vw, 46vw" />
            <span className="block px-3 py-2.5">
              <span className="block truncate text-sm font-semibold text-navy">{item.alt || item.filename}</span>
              <span className={cn("flex items-center gap-1 text-xs", item.kind === "image" && !item.alt ? "font-semibold text-danger" : "text-muted")}>
                {item.kind === "image" && !item.alt ? (
                  <>
                    <WarningIcon weight="fill" className="size-3.5" /> Needs alt text
                  </>
                ) : (
                  <>
                    {item.kind === "image" ? SOURCES.find((s) => s.value === item.source)?.label.split(" ")[0] : KIND_NOUN[item.kind].replace(/^./, (c) => c.toUpperCase())}
                    {item.sizeBytes ? ` · ${formatBytes(item.sizeBytes)}` : ""}
                  </>
                )}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
});

/* ---- edit dialog -------------------------------------------------------------- */

const CROPS = [
  { label: "Wide (16:9)", ratio: "16 / 9" },
  { label: "Portrait (4:5)", ratio: "4 / 5" },
  { label: "Square", ratio: "1 / 1" },
];

function MediaEditor({ item, canDelete, onClose, onChanged }: { item: MediaView; canDelete: boolean; onClose: () => void; onChanged: (next: MediaView | null) => Promise<void> }) {
  const [form, setForm] = useState({
    alt: item.alt,
    caption: item.caption ?? "",
    credit: item.credit ?? "",
    licence: item.licence ?? "",
    sourceUrl: item.sourceUrl ?? "",
    source: item.source,
    focalX: item.focalX,
    focalY: item.focalY,
  });
  const [status, setStatus] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [usage, setUsage] = useState<MediaUsage[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const isImage = item.kind === "image";
  const vector = item.mimeType === "image/svg+xml";
  const focal = `${form.focalX * 100}% ${form.focalY * 100}%`;

  const replaceQueue = useUploadQueue({
    onUploaded: async () => {
      const list = await listMediaAction();
      const next = list.ok ? (list.items.find((m) => m.id === item.id) ?? null) : null;
      setStatus({ tone: "success", text: "File replaced everywhere it is used." });
      await onChanged(next);
    },
  });

  const save = () =>
    startTransition(async () => {
      const result = await updateMediaAction(item.id, form);
      if (result.ok) {
        setStatus({ tone: "success", text: "Saved." });
        await onChanged(result.item);
      } else setStatus({ tone: "danger", text: result.message });
    });

  const loadUsage = () =>
    startTransition(async () => {
      const result = await mediaUsageAction(item.id);
      if (result.ok) setUsage(result.usage);
    });

  const remove = (force: boolean) =>
    startTransition(async () => {
      const result = await deleteMediaAction(item.id, force);
      if (!result.ok) {
        setStatus({ tone: "danger", text: result.message });
        return;
      }
      if (result.usage) {
        setUsage(result.usage);
        setConfirmDelete(true);
        setStatus({ tone: "danger", text: result.message ?? "This item is in use." });
        return;
      }
      toast({ tone: "success", title: "Deleted", detail: item.filename });
      await onChanged(null);
      onClose();
    });

  const liveUsage = usage?.filter((u) => u.live) ?? [];
  const replacing = replaceQueue.items.find((entry) => entry.status === "active" || entry.status === "waiting");
  const replaceError = replaceQueue.items.find((entry) => entry.status === "error");

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[#141414]/55 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_0.2s_ease-out]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="admin-dialog fixed inset-x-0 bottom-0 z-[var(--z-overlay)] flex max-h-[94dvh] flex-col rounded-t-3xl bg-surface shadow-lift outline-none md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[90dvh] md:w-[min(62rem,94vw)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
            <Dialog.Title className="min-w-0 truncate text-lg">{item.filename}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" className="grid size-11 shrink-0 place-items-center rounded-full text-navy hover:bg-mist">
                <XIcon weight="bold" className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="grid gap-6 overflow-y-auto overscroll-contain p-4 sm:p-6 md:grid-cols-2">
            <div className="min-w-0">
              {isImage ? (
                <>
                  <p className="field-label">Focal point</p>
                  <p className="field-help mb-2 mt-0">Click the most important part of the picture. Crops on every screen size keep it in view.</p>
                  <button
                    type="button"
                    aria-label="Set the focal point by clicking the image"
                    disabled={vector}
                    className="relative block w-full cursor-crosshair overflow-hidden rounded-2xl bg-[repeating-conic-gradient(#f5f5f5_0_25%,#fff_0_50%)] bg-[length:16px_16px] disabled:cursor-default"
                    onClick={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      setForm((f) => ({
                        ...f,
                        focalX: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
                        focalY: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
                      }));
                    }}
                  >
                    <Image
                      src={item.url}
                      alt={item.alt || "Selected image"}
                      width={item.width ?? 800}
                      height={item.height ?? 600}
                      sizes="(min-width: 48rem) 30rem, 92vw"
                      unoptimized={vector}
                      className="h-auto max-h-[22rem] w-full object-contain"
                    />
                    {!vector && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-accent shadow-[0_0_0_2px_var(--color-navy)] transition-[left,top] duration-200"
                        style={{ left: `${form.focalX * 100}%`, top: `${form.focalY * 100}%` }}
                      />
                    )}
                  </button>
                  {!vector && (
                    <>
                      <p className="field-label mt-5">Crop preview</p>
                      <div className="grid grid-cols-3 items-start gap-3">
                        {CROPS.map((crop) => (
                          <figure key={crop.label}>
                            <div className="relative overflow-hidden rounded-lg bg-mist" style={{ aspectRatio: crop.ratio }}>
                              <Image src={item.url} alt="" fill sizes="160px" className="object-cover" style={{ objectPosition: focal }} />
                            </div>
                            <figcaption className="mt-1 text-xs text-muted">{crop.label}</figcaption>
                          </figure>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : item.kind === "video" ? (
                <video src={item.url} controls preload="metadata" playsInline className="aspect-video w-full rounded-2xl bg-black" aria-label={`Preview of ${item.filename}`} />
              ) : (
                <MediaThumb item={item} className="aspect-[4/3] w-full rounded-2xl" />
              )}
              <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                {item.width && item.height && (
                  <>
                    <dt className="text-muted">Dimensions</dt>
                    <dd>
                      {item.width} x {item.height} px
                    </dd>
                  </>
                )}
                {item.sizeBytes && (
                  <>
                    <dt className="text-muted">File size</dt>
                    <dd>{formatBytes(item.sizeBytes)}</dd>
                  </>
                )}
                <dt className="text-muted">Address</dt>
                <dd className="[overflow-wrap:anywhere]">
                  {item.url}
                  {!isImage && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-link ml-2 inline-flex">
                      <ArrowSquareOutIcon aria-hidden weight="bold" className="size-4" />
                      Open<span className="sr-only"> {item.filename} (opens in a new tab)</span>
                    </a>
                  )}
                </dd>
              </dl>
              {replacing && (
                <div className="mt-4">
                  <UploadQueue items={[replacing]} />
                </div>
              )}
            </div>

            <div className="grid content-start gap-4">
              {isImage && (
                <div>
                  <label htmlFor="media-alt" className="field-label">
                    Alt text
                  </label>
                  <textarea id="media-alt" rows={2} maxLength={300} value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} className="field-input" style={{ minHeight: "4.5rem" }} />
                  <p className="field-help">Describe what the picture shows, for people who cannot see it. One sentence is enough.</p>
                </div>
              )}
              <div>
                <label htmlFor="media-caption" className="field-label">
                  {isImage ? "Caption" : "Title"}
                </label>
                <input id="media-caption" maxLength={300} value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="field-input" />
                <p className="field-help">{isImage ? "Optional. Shown under the image in galleries." : "Optional. Helps you find it in the library."}</p>
              </div>
              <div>
                <label htmlFor="media-source" className="field-label">
                  Where it came from
                </label>
                <select id="media-source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as MediaView["source"] })} className="field-input">
                  {SOURCES.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="media-licence" className="field-label">
                  Licence or usage rights
                </label>
                <input id="media-licence" maxLength={500} value={form.licence} onChange={(e) => setForm({ ...form, licence: e.target.value })} className="field-input" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="media-credit" className="field-label">
                    Credit
                  </label>
                  <input id="media-credit" maxLength={200} value={form.credit} onChange={(e) => setForm({ ...form, credit: e.target.value })} className="field-input" />
                </div>
                <div>
                  <label htmlFor="media-source-url" className="field-label">
                    Source link
                  </label>
                  <input id="media-source-url" inputMode="url" value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} className="field-input" />
                </div>
              </div>

              {status && <Notice tone={status.tone}>{status.text}</Notice>}
              {replaceError && <Notice tone="danger">{replaceError.message}</Notice>}

              <div className="border-t border-line pt-4">
                <button type="button" className="text-link" onClick={loadUsage} disabled={pending}>
                  Where is this used?
                </button>
                {usage && (
                  <div className="mt-2 text-sm">
                    {usage.length === 0 ? (
                      <p className="text-muted">Not used anywhere yet.</p>
                    ) : (
                      <ul className="grid gap-1">
                        {usage.map((entry, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className={cn("size-2 shrink-0 rounded-full", entry.live ? "bg-success" : "bg-line")} aria-hidden />
                            {entry.href ? (
                              <Link href={entry.href} className="font-semibold text-primary hover:underline">
                                {entry.label}
                              </Link>
                            ) : (
                              entry.label
                            )}
                            {entry.live && <span className="text-xs text-success">live</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
            <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={save}>
              {pending ? "Saving" : "Save details"}
            </button>
            <input
              id="media-replace"
              type="file"
              accept={ACCEPT[item.kind]}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setStatus(null);
                if (file) void replaceQueue.add([file], { replaceId: item.id });
                e.target.value = "";
              }}
            />
            <label htmlFor="media-replace" className={cn("btn btn-quiet btn-sm cursor-pointer", replacing && "pointer-events-none opacity-60")}>
              <ArrowsClockwiseIcon weight="bold" className="size-4" />
              {replacing ? "Replacing" : "Replace file"}
            </label>
            {canDelete && (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {confirmDelete && liveUsage.length === 0 ? (
                  <button type="button" className="btn btn-danger btn-sm" disabled={pending} onClick={() => remove(true)}>
                    Delete anyway
                  </button>
                ) : (
                  <button type="button" className="btn btn-quiet btn-sm text-danger hover:border-danger" disabled={pending} onClick={() => remove(false)}>
                    <TrashIcon weight="bold" className="size-4" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
