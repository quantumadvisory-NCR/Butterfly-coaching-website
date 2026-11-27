"use client";

import { FilePdfIcon, FilmStripIcon, ImageIcon, MagnifyingGlassIcon, PlayIcon, UploadSimpleIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { Dialog } from "radix-ui";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { type MediaView, listMediaAction } from "@/app/admin/actions/operations";
import { ACCEPT, KIND_NOUN, type UploadKind, formatBytes } from "@/lib/media-kinds";
import { cn } from "@/lib/utils";
import { UploadQueue, useUploadQueue } from "./upload-queue";

/* ---- shared library state -------------------------------------------------- */

type Library = {
  items: MediaView[];
  byId: Map<string, MediaView>;
  refresh: () => Promise<MediaView[]>;
};

const LibraryContext = createContext<Library | null>(null);

/** Loads the media library once per screen and shares it with every picker on it. */
export function MediaLibraryProvider({ initial, children }: { initial: MediaView[]; children: ReactNode }) {
  const [items, setItems] = useState(initial);
  const refresh = useCallback(async () => {
    const result = await listMediaAction();
    if (!result.ok) return [];
    setItems(result.items);
    return result.items;
  }, []);
  const value = useMemo(() => ({ items, byId: new Map(items.map((item) => [item.id, item])), refresh }), [items, refresh]);
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useMediaLibrary(): Library {
  const library = useContext(LibraryContext);
  if (!library) throw new Error("MediaLibraryProvider is missing.");
  return library;
}

/* ---- previews ---------------------------------------------------------------- */

/**
 * A video's opening frame, fetched only once its tile is about to scroll into
 * view, so opening a library with many videos does not start a download for each.
 */
function VideoFrame({ url }: { url: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = box.current;
    if (!element || near) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setNear(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [near]);
  return (
    <div ref={box} className="absolute inset-0">
      {near && <video src={`${url}#t=0.5`} preload="metadata" muted playsInline tabIndex={-1} className="pointer-events-none size-full object-cover" />}
    </div>
  );
}

const CHECKERBOARD ="bg-[repeating-conic-gradient(#f5f5f5_0_25%,#fff_0_50%)] bg-[length:16px_16px]";

/** A preview of any library item: the picture, a video's opening frame, or a PDF badge. */
export function MediaThumb({ item, className, sizes = "200px" }: { item: MediaView; className?: string; sizes?: string }) {
  if (item.kind === "video") {
    return (
      <div className={cn("relative overflow-hidden bg-[#1b1b1b]", className)}>
        <VideoFrame url={item.url} />
        <span aria-hidden className="absolute inset-0 grid place-items-center">
          <span className="grid size-10 place-items-center rounded-full bg-white/90 text-navy shadow-lg">
            <PlayIcon weight="fill" className="ml-0.5 size-4" />
          </span>
        </span>
        <span aria-hidden className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[0.6875rem] font-bold text-white">
          <FilmStripIcon weight="bold" className="size-3" /> Video
        </span>
      </div>
    );
  }
  if (item.kind === "file") {
    return (
      <div className={cn("grid place-items-center bg-[linear-gradient(160deg,#faf7f0,#f1ece1)] text-[#a3242b]", className)}>
        <span className="grid justify-items-center gap-1">
          <FilePdfIcon weight="duotone" className="size-10" />
          <span className="text-[0.6875rem] font-bold tracking-[0.12em] text-[#7a1b20]">PDF{item.sizeBytes ? ` · ${formatBytes(item.sizeBytes)}` : ""}</span>
        </span>
      </div>
    );
  }
  const contain = item.mimeType === "image/svg+xml" || item.url.includes("/icf/") || item.url.includes("/logos/");
  return (
    <div className={cn("relative overflow-hidden", CHECKERBOARD, className)}>
      <Image
        src={item.url}
        alt=""
        fill
        sizes={sizes}
        unoptimized={item.mimeType === "image/svg+xml"}
        className={contain ? "object-contain p-2" : "object-cover"}
        style={{ objectPosition: `${item.focalX * 100}% ${item.focalY * 100}%` }}
      />
    </div>
  );
}

/* ---- choosing from the library ---------------------------------------------- */

const SOURCE_LABEL: Record<string, string> = { bca: "BCA", stock: "Stock", ai: "AI-generated", upload: "Upload" };
const A_NOUN: Record<UploadKind, string> = { image: "an image", video: "a video", file: "a PDF" };

/** Browse the library for one kind of item, or upload a new one, and pick it. */
function LibraryDialog({
  id,
  kind,
  selectedId,
  trigger,
  onPick,
}: {
  id: string;
  kind: UploadKind;
  selectedId?: string | null;
  trigger: ReactNode;
  onPick: (item: MediaView) => void;
}) {
  const library = useMediaLibrary();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const noun = KIND_NOUN[kind];

  const queue = useUploadQueue({
    onUploaded: async (ids) => {
      const items = await library.refresh();
      const uploaded = items.find((item) => item.id === ids[0]);
      if (uploaded) {
        onPick(uploaded);
        setOpen(false);
      }
    },
  });

  const q = query.trim().toLowerCase();
  const results = library.items.filter((item) => item.kind === kind && (!q || `${item.filename} ${item.alt} ${item.caption ?? ""}`.toLowerCase().includes(q)));

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="admin-overlay fixed inset-0 z-[var(--z-overlay)] bg-[#141414]/55 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_0.2s_ease-out]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="admin-dialog fixed inset-x-0 bottom-0 z-[var(--z-overlay)] flex max-h-[92dvh] flex-col rounded-t-3xl bg-surface shadow-lift outline-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[min(44rem,88dvh)] sm:w-[min(60rem,94vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
            <Dialog.Title className="text-lg">Choose {A_NOUN[kind]}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" className="grid size-11 place-items-center rounded-full text-navy hover:bg-mist">
                <XIcon weight="bold" className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:px-6">
            <div className="relative flex-1">
              <MagnifyingGlassIcon aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
              <label htmlFor={`${id}-search`} className="sr-only">
                Search the media library
              </label>
              <input
                id={`${id}-search`}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or description"
                className="field-input min-h-11 pl-10"
              />
            </div>
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPT[kind]}
              className="sr-only"
              id={`${id}-upload`}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void queue.add([file]);
                event.target.value = "";
              }}
            />
            <label htmlFor={`${id}-upload`} className={cn("btn btn-dark btn-sm cursor-pointer", queue.busy && "pointer-events-none opacity-60")}>
              <UploadSimpleIcon weight="bold" className="size-4" />
              {queue.busy ? "Uploading" : `Upload new ${noun}`}
            </label>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
            <UploadQueue items={queue.items} onClear={queue.clear} className="mb-4" />
            {results.length === 0 ? (
              <p className="py-10 text-center text-muted">Nothing matches. Try another search, or upload a new {noun}.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {results.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onPick(item);
                        setOpen(false);
                      }}
                      aria-pressed={item.id === selectedId}
                      className={cn(
                        "group block w-full overflow-hidden rounded-2xl border-2 text-left transition-[border-color,box-shadow] duration-200",
                        item.id === selectedId ? "border-accent shadow-[0_0_0_3px_rgb(245_186_0/0.25)]" : "border-transparent hover:border-line",
                      )}
                    >
                      <MediaThumb item={item} className="aspect-[4/3] w-full rounded-xl" sizes="(min-width: 48rem) 220px, 45vw" />
                      <span className="block px-2 py-1.5">
                        <span className="block truncate text-xs font-semibold text-navy">{item.alt || item.filename}</span>
                        <span className="block text-[0.6875rem] text-muted">{SOURCE_LABEL[item.source]}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const EMPTY_ICON = { image: ImageIcon, video: FilmStripIcon, file: FilePdfIcon } as const;

/** An image, video or PDF from the media library, stored by its id. */
export function MediaPicker({
  id,
  value,
  onChange,
  kind = "image",
  invalid,
}: {
  id: string;
  value: string | null;
  onChange: (id: string | null) => void;
  kind?: UploadKind;
  invalid?: boolean;
}) {
  const library = useMediaLibrary();
  const current = value ? library.byId.get(value) : undefined;
  const noun = KIND_NOUN[kind];
  const Empty = EMPTY_ICON[kind];

  return (
    <div className={cn("rounded-[var(--radius-field)] border-[1.5px] border-dashed p-3 transition-colors", invalid ? "border-danger" : "border-[#b9b8b3] hover:border-navy/50")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {current ? (
          <MediaThumb item={current} className="h-24 w-full shrink-0 rounded-xl sm:w-32" sizes="160px" />
        ) : (
          <div className="grid h-24 w-full shrink-0 place-items-center rounded-xl bg-mist text-muted sm:w-32">
            <Empty className="size-7" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {current ? (
            <>
              <p className="truncate text-sm font-semibold text-navy">{current.filename}</p>
              {kind === "image" && (
                <p className={cn("mt-0.5 text-sm", current.alt ? "text-muted" : "font-semibold text-danger")}>
                  {current.alt ? `Alt text: ${current.alt}` : "No alt text yet. Add it in the Media library."}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">No {noun} chosen.</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <LibraryDialog
              id={id}
              kind={kind}
              selectedId={value}
              onPick={(item) => onChange(item.id)}
              trigger={
                <button id={id} type="button" className="btn btn-quiet btn-sm">
                  {current ? `Change ${noun}` : `Choose ${noun}`}
                </button>
              }
            />
            {current && (
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => onChange(null)}>
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The button beside an address field that fills it from the media library
 * (for fields that store an address, such as a story's video link).
 */
export function LibraryAddressButton({ id, kind, value, onChange }: { id: string; kind: "image" | "video"; value: string; onChange: (url: string) => void }) {
  const library = useMediaLibrary();
  const selected = library.items.find((item) => item.url === value);
  return (
    <LibraryDialog
      id={`${id}-library`}
      kind={kind}
      selectedId={selected?.id}
      onPick={(item) => onChange(item.url)}
      trigger={
        <button type="button" className="btn btn-quiet btn-sm shrink-0">
          {kind === "video" ? <FilmStripIcon weight="bold" className="size-4" /> : <ImageIcon weight="bold" className="size-4" />}
          {kind === "video" ? "Choose or upload a video" : "Choose or upload an image"}
        </button>
      }
    />
  );
}
