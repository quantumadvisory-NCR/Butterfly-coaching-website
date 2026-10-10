"use client";

import { FilePdfIcon, ImageIcon, MagnifyingGlassIcon, UploadSimpleIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { Dialog } from "radix-ui";
import { type ReactNode, createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { type MediaView, listMediaAction } from "@/app/admin/actions/operations";
import { cn } from "@/lib/utils";

/* ---- shared library state -------------------------------------------------- */

type Library = {
  items: MediaView[];
  byId: Map<string, MediaView>;
  loaded: boolean;
  refresh: () => Promise<MediaView[]>;
};

const LibraryContext = createContext<Library | null>(null);

/** Loads the media library once per screen and shares it with every picker on it. */
export function MediaLibraryProvider({ initial, children }: { initial: MediaView[]; children: ReactNode }) {
  const [items, setItems] = useState(initial);
  const refresh = useCallback(async () => {
    const result = await listMediaAction();
    if (result.ok) {
      setItems(result.items);
      return result.items;
    }
    return items;
  }, [items]);
  const value = useMemo(() => ({ items, byId: new Map(items.map((item) => [item.id, item])), loaded: true, refresh }), [items, refresh]);
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useMediaLibrary(): Library {
  const library = useContext(LibraryContext);
  if (!library) throw new Error("MediaLibraryProvider is missing.");
  return library;
}

/* ---- helpers ---------------------------------------------------------------- */

export function MediaThumb({ item, className, sizes = "200px" }: { item: MediaView; className?: string; sizes?: string }) {
  if (item.kind !== "image") {
    return (
      <div className={cn("grid place-items-center bg-sky text-primary", className)}>
        <FilePdfIcon weight="fill" className="size-9" />
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden bg-[repeating-conic-gradient(#f5f5f5_0_25%,#fff_0_50%)] bg-[length:16px_16px]", className)}>
      <Image
        src={item.url}
        alt=""
        fill
        sizes={sizes}
        unoptimized={item.mimeType === "image/svg+xml"}
        className={item.mimeType === "image/svg+xml" || item.url.includes("/icf/") || item.url.includes("/logos/") ? "object-contain p-2" : "object-cover"}
        style={{ objectPosition: `${item.focalX * 100}% ${item.focalY * 100}%` }}
      />
    </div>
  );
}

export async function uploadFile(file: File, replaceId?: string): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const body = new FormData();
  body.append("file", file);
  if (replaceId) body.append("replace", replaceId);
  try {
    const response = await fetch("/api/admin/media/", { method: "POST", body });
    const json = (await response.json().catch(() => null)) as { ok: boolean; id?: string; message?: string } | null;
    if (json?.ok && json.id) return { ok: true, id: json.id };
    return { ok: false, message: json?.message ?? (response.status === 413 ? "The file is too large." : "The upload failed. Please try again.") };
  } catch {
    return { ok: false, message: "The upload failed. Check your connection and try again." };
  }
}

/* ---- picker ----------------------------------------------------------------- */

const SOURCE_LABEL: Record<string, string> = { bca: "BCA", stock: "Stock", ai: "AI-generated", upload: "Upload" };

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
  kind?: "image" | "file";
  invalid?: boolean;
}) {
  const library = useMediaLibrary();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const current = value ? library.byId.get(value) : undefined;
  const noun = kind === "image" ? "image" : "file";

  const results = library.items.filter((item) => {
    if (item.kind !== kind) return false;
    const q = query.trim().toLowerCase();
    return !q || `${item.filename} ${item.alt} ${item.caption ?? ""}`.toLowerCase().includes(q);
  });

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    const result = await uploadFile(file);
    if (result.ok) {
      await library.refresh();
      onChange(result.id);
      setOpen(false);
    } else setError(result.message);
    setBusy(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <div className={cn("rounded-[var(--radius-field)] border-[1.5px] border-dashed p-3", invalid ? "border-danger" : "border-[#8a8f8d]")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {current ? (
          <MediaThumb item={current} className="h-24 w-full shrink-0 rounded-lg sm:w-32" sizes="160px" />
        ) : (
          <div className="grid h-24 w-full shrink-0 place-items-center rounded-lg bg-mist text-muted sm:w-32">
            <ImageIcon className="size-7" />
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
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild>
                <button id={id} type="button" className="btn btn-quiet btn-sm">
                  {current ? `Change ${noun}` : `Choose ${noun}`}
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-navy/50 data-[state=open]:animate-[fade-in_0.2s_ease-out]" />
                <Dialog.Content
                  aria-describedby={undefined}
                  className="fixed inset-x-0 bottom-0 z-[var(--z-overlay)] flex max-h-[92dvh] flex-col rounded-t-2xl bg-surface shadow-lift outline-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[min(44rem,88dvh)] sm:w-[min(60rem,94vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
                    <Dialog.Title className="text-lg">Choose {kind === "image" ? "an image" : "a file"}</Dialog.Title>
                    <Dialog.Close asChild>
                      <button type="button" aria-label="Close" className="grid size-11 place-items-center rounded-full text-navy hover:bg-sky">
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
                      accept={kind === "image" ? "image/jpeg,image/png,image/webp,image/avif,image/gif" : "application/pdf"}
                      className="sr-only"
                      id={`${id}-upload`}
                      onChange={(event) => onUpload(event.target.files?.[0])}
                    />
                    <label htmlFor={`${id}-upload`} className={cn("btn btn-blue btn-sm cursor-pointer", busy && "pointer-events-none opacity-60")}>
                      <UploadSimpleIcon weight="bold" className="size-4" />
                      {busy ? "Uploading" : `Upload new ${noun}`}
                    </label>
                  </div>
                  {error && (
                    <p role="alert" className="bg-danger-soft px-4 py-2 text-sm font-semibold text-danger sm:px-6">
                      {error}
                    </p>
                  )}
                  <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
                    {results.length === 0 ? (
                      <p className="py-10 text-center text-muted">Nothing matches. Try another search, or upload a new {noun}.</p>
                    ) : (
                      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {results.map((item) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => {
                                onChange(item.id);
                                setOpen(false);
                              }}
                              aria-pressed={item.id === value}
                              className={cn(
                                "group block w-full overflow-hidden rounded-xl border-2 text-left transition-colors",
                                item.id === value ? "border-primary" : "border-transparent hover:border-sky-line",
                              )}
                            >
                              <MediaThumb item={item} className="aspect-[4/3] w-full" sizes="(min-width: 48rem) 220px, 45vw" />
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
