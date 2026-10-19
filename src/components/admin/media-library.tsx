"use client";

import { ArrowsClockwiseIcon, MagnifyingGlassIcon, TrashIcon, UploadSimpleIcon, WarningIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { AdminLink as Link } from "@/components/admin/admin-link";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { useRef, useState, useTransition } from "react";
import { type MediaView, deleteMediaAction, listMediaAction, mediaUsageAction, updateMediaAction } from "@/app/admin/actions/operations";
import type { MediaUsage } from "@/lib/admin/media-store";
import { cn } from "@/lib/utils";
import { MediaThumb, uploadFile } from "./media-picker";
import { Notice } from "./ui";

const SOURCES = [
  { value: "bca", label: "Authentic BCA photograph or asset" },
  { value: "stock", label: "Licensed stock" },
  { value: "ai", label: "AI-generated" },
  { value: "upload", label: "Uploaded (not yet classified)" },
] as const;

const FILTERS = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "file", label: "Files" },
  { value: "bca", label: "BCA" },
  { value: "ai", label: "AI-generated" },
  { value: "stock", label: "Stock" },
  { value: "no-alt", label: "Missing alt text" },
] as const;

const formatSize = (bytes: number | null) => (bytes ? (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`) : "");

export function MediaLibrary({ initial, canDelete }: { initial: MediaView[]; canDelete: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
  const [selected, setSelected] = useState<MediaView | null>(null);
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState<{ tone: "success" | "danger"; text: string }[]>([]);
  const input = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    const result = await listMediaAction();
    if (result.ok) setItems(result.items);
    router.refresh();
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const outcome: typeof messages = [];
    for (const file of Array.from(files)) {
      const result = await uploadFile(file);
      outcome.push(result.ok ? { tone: "success", text: `${file.name} uploaded.` } : { tone: "danger", text: `${file.name}: ${result.message}` });
    }
    setMessages(outcome);
    await refresh();
    setUploading(false);
    if (input.current) input.current.value = "";
  };

  const visible = items.filter((item) => {
    if (filter === "image" || filter === "file") {
      if (item.kind !== filter) return false;
    } else if (filter === "no-alt") {
      if (item.kind !== "image" || item.alt) return false;
    } else if (filter !== "all" && item.source !== filter) return false;
    const q = query.trim().toLowerCase();
    return !q || `${item.filename} ${item.alt} ${item.caption ?? ""} ${item.credit ?? ""}`.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <label htmlFor="media-search" className="sr-only">
            Search media
          </label>
          <input id="media-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or description" className="field-input pl-10" />
        </div>
        <input
          ref={input}
          id="media-upload"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif,application/pdf"
          className="sr-only"
          onChange={(e) => upload(e.target.files)}
        />
        <label htmlFor="media-upload" className={cn("btn btn-primary btn-sm cursor-pointer", uploading && "pointer-events-none opacity-60")}>
          <UploadSimpleIcon weight="bold" className="size-4" />
          {uploading ? "Uploading" : "Upload images or PDFs"}
        </label>
      </div>

      <div role="group" aria-label="Filter media" className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={cn("min-h-10 rounded-full px-4 text-sm font-semibold", filter === option.value ? "bg-navy text-white" : "border border-line bg-surface text-navy hover:border-navy")}
          >
            {option.label}
          </button>
        ))}
      </div>

      {messages.length > 0 && (
        <div className="mb-5 grid gap-2" role="status">
          {messages.map((message, i) => (
            <Notice key={i} tone={message.tone}>
              {message.text}
            </Notice>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center text-muted">Nothing here yet. Upload an image or change the filter.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {visible.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => setSelected(item)} className="group block w-full overflow-hidden rounded-xl border border-line bg-surface text-left hover:border-primary">
                <MediaThumb item={item} className="aspect-[4/3] w-full" sizes="(min-width: 80rem) 200px, (min-width: 48rem) 24vw, 46vw" />
                <span className="block px-2.5 py-2">
                  <span className="block truncate text-sm font-semibold text-navy">{item.alt || item.filename}</span>
                  <span className={cn("flex items-center gap-1 text-xs", item.kind === "image" && !item.alt ? "font-semibold text-danger" : "text-muted")}>
                    {item.kind === "image" && !item.alt ? (
                      <>
                        <WarningIcon weight="fill" className="size-3.5" /> Needs alt text
                      </>
                    ) : (
                      SOURCES.find((s) => s.value === item.source)?.label.split(" ")[0]
                    )}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
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
  const replaceInput = useRef<HTMLInputElement>(null);
  const isImage = item.kind === "image";
  const vector = item.mimeType === "image/svg+xml";
  const focal = `${form.focalX * 100}% ${form.focalY * 100}%`;

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
      await onChanged(null);
      onClose();
    });

  const replace = async (file: File | undefined) => {
    if (!file) return;
    setStatus(null);
    const result = await uploadFile(file, item.id);
    if (!result.ok) {
      setStatus({ tone: "danger", text: result.message });
      return;
    }
    const list = await listMediaAction();
    const next = list.ok ? (list.items.find((m) => m.id === item.id) ?? null) : null;
    setStatus({ tone: "success", text: "File replaced everywhere it is used." });
    await onChanged(next);
  };

  const liveUsage = usage?.filter((u) => u.live) ?? [];

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-navy/50 data-[state=open]:animate-[fade-in_0.2s_ease-out]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-[var(--z-overlay)] flex max-h-[94dvh] flex-col rounded-t-2xl bg-surface shadow-lift outline-none md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[90dvh] md:w-[min(62rem,94vw)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
            <Dialog.Title className="min-w-0 truncate text-lg">{item.filename}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" className="grid size-11 shrink-0 place-items-center rounded-full text-navy hover:bg-tint">
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
                    className="relative block w-full cursor-crosshair overflow-hidden rounded-xl bg-[repeating-conic-gradient(#f5f5f5_0_25%,#fff_0_50%)] bg-[length:16px_16px] disabled:cursor-default"
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
                        className="pointer-events-none absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-accent shadow-[0_0_0_2px_var(--color-navy)]"
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
              ) : (
                <MediaThumb item={item} className="aspect-[4/3] w-full rounded-xl" />
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
                    <dd>{formatSize(item.sizeBytes)}</dd>
                  </>
                )}
                <dt className="text-muted">Address</dt>
                <dd className="[overflow-wrap:anywhere]">{item.url}</dd>
              </dl>
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
                  Caption
                </label>
                <input id="media-caption" maxLength={300} value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="field-input" />
                <p className="field-help">Optional. Shown under the image in galleries.</p>
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
            <input ref={replaceInput} id="media-replace" type="file" accept={isImage ? "image/jpeg,image/png,image/webp,image/avif,image/gif" : "application/pdf"} className="sr-only" onChange={(e) => replace(e.target.files?.[0])} />
            <label htmlFor="media-replace" className="btn btn-quiet btn-sm cursor-pointer">
              <ArrowsClockwiseIcon weight="bold" className="size-4" />
              Replace file
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
