"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretDownIcon,
  CheckCircleIcon,
  CopyIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { useEffect, useState, useTransition } from "react";
import {
  deletePageAction,
  duplicatePageAction,
  restoreRevisionAction,
  savePageAction,
  setPageStatusAction,
} from "@/app/admin/actions/content";
import type { MediaView } from "@/app/admin/actions/operations";
import { BLOCKS, type BlockType, defaultBlockData, getBlock } from "@/lib/blocks/registry";
import { cn, formatDateTime } from "@/lib/utils";
import { ConfirmButton } from "./confirm-button";
import { FieldRenderer, type RefOptions } from "./field-renderer";
import { MediaLibraryProvider, MediaPicker } from "./media-picker";
import { Card, Notice, StatusBadge } from "./ui";

type Section = { key: string; id?: string; type: string; data: Record<string, unknown>; isHidden: boolean };

export type PageEditorProps = {
  id: string | null;
  initial: {
    title: string;
    path: string;
    seoTitle: string;
    seoDescription: string;
    ogImageId: string | null;
    noindex: boolean;
    sections: { id: string; type: string; data: Record<string, unknown>; isHidden: boolean }[];
  };
  meta: { status: string; hasUnpublishedChanges: boolean; isSystem: boolean; publishedAt: string | null } | null;
  revisions: { id: string; label: string; createdAt: string; email: string | null }[];
  refOptions: RefOptions;
  media: MediaView[];
  canDelete: boolean;
  /** True straight after this page was created, so the confirmation survives the move to its own address. */
  justSaved?: boolean;
};

let keySeed = 0;
const newKey = () => `s${Date.now().toString(36)}${(keySeed += 1)}`;

function summarise(section: Section): string {
  const heading = section.data.heading;
  return typeof heading === "string" && heading ? heading : "";
}

/** The page builder: page settings, an ordered list of sections, and the publish controls. */
export function PageEditor({ id, initial, meta, revisions, refOptions, media, canDelete, justSaved }: PageEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [path, setPath] = useState(initial.path);
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle);
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription);
  const [ogImageId, setOgImageId] = useState(initial.ogImageId);
  const [noindex, setNoindex] = useState(initial.noindex);
  const [sections, setSections] = useState<Section[]>(() => initial.sections.map((section) => ({ ...section, key: section.id })));
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sectionErrors, setSectionErrors] = useState<Record<number, Record<string, string>>>({});
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(
    justSaved
      ? { tone: "success", text: meta?.status === "published" ? "Published. The live site has been updated." : "Draft saved. It stays private until you publish." }
      : null,
  );
  const [dirty, setDirty] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const touch = () => setDirty(true);
  const update = (next: Section[]) => {
    setSections(next);
    touch();
  };
  const moveSection = (from: number, to: number) => {
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    update(next);
    setSectionErrors({});
  };

  const payload = () => ({
    title,
    path,
    seoTitle,
    seoDescription,
    ogImageId,
    noindex,
    sections: sections.map((section) => ({ id: section.id, type: section.type, data: section.data, isHidden: section.isHidden })),
  });

  const save = (publish: boolean, then?: (pageId: string) => void) =>
    startTransition(async () => {
      setStatus(null);
      const result = await savePageAction(id, payload(), publish);
      if (result.ok) {
        setErrors({});
        setSectionErrors({});
        setDirty(false);
        setStatus({ tone: "success", text: result.message ?? "Saved." });
        if (then) then(result.id);
        if (!id) router.replace(`/admin/pages/${result.id}/?saved=1`);
        else router.refresh();
      } else {
        setErrors(result.errors ?? {});
        const bySection = "sectionErrors" in result && result.sectionErrors ? result.sectionErrors : {};
        setSectionErrors(bySection);
        const firstBad = Object.keys(bySection)[0];
        if (firstBad !== undefined) setOpenKey(sections[Number(firstBad)]?.key ?? null);
        setStatus({ tone: "error", text: result.message });
      }
    });

  const published = meta?.status === "published";
  const livePath = published ? path : null;

  return (
    <MediaLibraryProvider initial={media}>
      <div className="grid gap-6 pb-28 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
        {/* ---- sections ---- */}
        <div className="grid min-w-0 gap-4">
          <Card title="Page">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="page-title" className="field-label">
                  Title <span className="text-danger" aria-hidden>*</span>
                </label>
                <input
                  id="page-title"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    touch();
                  }}
                  aria-invalid={Boolean(errors.title)}
                  className="field-input"
                />
                <p className="field-help">Used in menus, breadcrumbs and the browser tab.</p>
                {errors.title && <p className="field-error">{errors.title}</p>}
              </div>
              <div>
                <label htmlFor="page-path" className="field-label">
                  Address <span className="text-danger" aria-hidden>*</span>
                </label>
                <input
                  id="page-path"
                  value={path}
                  onChange={(event) => {
                    setPath(event.target.value);
                    touch();
                  }}
                  disabled={initial.path === "/" && Boolean(id)}
                  placeholder="/new-page/"
                  aria-invalid={Boolean(errors.path)}
                  className="field-input font-mono text-[0.9375rem] disabled:bg-mist"
                />
                <p className="field-help">
                  {initial.path === "/" && id ? "This is the homepage." : "Lower-case letters, numbers and hyphens. If you change the address of a live page, add a redirect from the old one."}
                </p>
                {errors.path && <p className="field-error">{errors.path}</p>}
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-between gap-3 pt-2">
            <h2 className="text-lg">Sections</h2>
            <button type="button" className="btn btn-blue btn-sm" onClick={() => setAdding(true)}>
              <PlusIcon weight="bold" className="size-4" />
              Add section
            </button>
          </div>

          {sections.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-10 text-center text-muted">
              This page has no sections yet. Choose <strong className="text-navy">Add section</strong> to start building it.
            </div>
          )}

          <ol className="grid gap-3">
            {sections.map((section, index) => {
              const block = getBlock(section.type);
              const open = openKey === section.key;
              const sectionError = sectionErrors[index];
              const summary = summarise(section);
              return (
                <li key={section.key} className={cn("rounded-2xl border bg-surface", sectionError ? "border-danger" : "border-line", section.isHidden && "opacity-70")}>
                  <div className="flex flex-wrap items-center gap-1 p-2">
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={`section-${section.key}`}
                      onClick={() => setOpenKey(open ? null : section.key)}
                      className="flex min-h-12 min-w-0 flex-[1_1_12rem] items-center gap-3 rounded-xl px-2 text-left hover:bg-sky"
                    >
                      <CaretDownIcon weight="bold" className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
                      <span className="min-w-0">
                        <span className="block text-xs font-bold uppercase tracking-wide text-primary">
                          {block?.label ?? section.type}
                          {section.isHidden && <span className="ml-2 text-muted">Hidden</span>}
                          {sectionError && <span className="ml-2 text-danger">Needs attention</span>}
                        </span>
                        <span className="block truncate font-semibold text-navy">{summary || block?.description || "Section"}</span>
                      </span>
                    </button>
                    <div className="flex gap-1">
                      <IconButton label="Move section up" disabled={index === 0} onClick={() => moveSection(index, index - 1)}>
                        <ArrowUpIcon weight="bold" className="size-4" />
                      </IconButton>
                      <IconButton label="Move section down" disabled={index === sections.length - 1} onClick={() => moveSection(index, index + 1)}>
                        <ArrowDownIcon weight="bold" className="size-4" />
                      </IconButton>
                      <IconButton
                        label={section.isHidden ? "Show section on the page" : "Hide section from the page"}
                        onClick={() => update(sections.map((x) => (x.key === section.key ? { ...x, isHidden: !x.isHidden } : x)))}
                      >
                        {section.isHidden ? <EyeSlashIcon weight="bold" className="size-4" /> : <EyeIcon weight="bold" className="size-4" />}
                      </IconButton>
                      <IconButton
                        label="Duplicate section"
                        onClick={() => {
                          const copy: Section = { ...section, key: newKey(), id: undefined, data: structuredClone(section.data) };
                          const next = [...sections];
                          next.splice(index + 1, 0, copy);
                          update(next);
                          setSectionErrors({});
                        }}
                      >
                        <CopyIcon weight="bold" className="size-4" />
                      </IconButton>
                      <IconButton
                        label="Remove section"
                        danger
                        onClick={() => {
                          if (window.confirm(`Remove this ${block?.label ?? "section"}? You can still discard the change by leaving without saving.`)) {
                            update(sections.filter((x) => x.key !== section.key));
                            setSectionErrors({});
                          }
                        }}
                      >
                        <TrashIcon weight="bold" className="size-4" />
                      </IconButton>
                    </div>
                  </div>
                  {open && block && (
                    <div id={`section-${section.key}`} className="border-t border-line p-4 sm:p-5">
                      <FieldRenderer
                        fields={block.fields}
                        value={section.data}
                        onChange={(next) => update(sections.map((x) => (x.key === section.key ? { ...x, data: next } : x)))}
                        errors={sectionError ?? {}}
                        refOptions={refOptions}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          {sections.length > 2 && (
            <button type="button" className="btn btn-quiet btn-sm justify-self-start" onClick={() => setAdding(true)}>
              <PlusIcon weight="bold" className="size-4" />
              Add section
            </button>
          )}
        </div>

        {/* ---- sidebar ---- */}
        <div className="grid gap-4 xl:sticky xl:top-6">
          <Card title="Status">
            {meta ? (
              <div className="grid gap-3 text-[0.9375rem]">
                <p className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={meta.status} />
                  {published && meta.hasUnpublishedChanges && <StatusBadge status="draft" label="Unpublished changes" />}
                </p>
                {published && meta.publishedAt && <p className="text-muted">Last published {formatDateTime(meta.publishedAt)}.</p>}
                {published && meta.hasUnpublishedChanges && (
                  <Notice tone="warning">Visitors still see the last published version. Publish to make your changes live.</Notice>
                )}
                {!published && <p className="text-muted">This page is not visible to visitors.</p>}
              </div>
            ) : (
              <p className="text-[0.9375rem] text-muted">New page. Save it as a draft, preview it, then publish when you are happy.</p>
            )}
            {id && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                {published && (
                  <ConfirmButton
                    label="Unpublish"
                    tone="neutral"
                    title="Unpublish this page?"
                    description="Visitors will no longer be able to open it. You can publish it again at any time."
                    confirmLabel="Unpublish"
                    action={() => setPageStatusAction(id, "draft")}
                    onDone={() => router.refresh()}
                  />
                )}
                <button
                  type="button"
                  className="btn btn-quiet btn-sm"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await duplicatePageAction(id);
                      if (result.ok) router.push(`/admin/pages/${result.id}/`);
                      else setStatus({ tone: "error", text: result.message });
                    })
                  }
                >
                  Duplicate
                </button>
                {meta?.status !== "archived" && (
                  <ConfirmButton
                    label="Archive"
                    tone="neutral"
                    title="Archive this page?"
                    description="It will be hidden from visitors and kept here for reference."
                    confirmLabel="Archive"
                    action={() => setPageStatusAction(id, "archived")}
                    onDone={() => router.refresh()}
                  />
                )}
                {canDelete && !meta?.isSystem && (
                  <ConfirmButton
                    label="Delete"
                    title="Delete this page?"
                    description="The page and its history will be removed permanently."
                    confirmLabel="Delete permanently"
                    action={() => deletePageAction(id)}
                    onDone={() => {
                      setDirty(false);
                      router.push("/admin/pages/");
                      router.refresh();
                    }}
                  />
                )}
              </div>
            )}
          </Card>

          <Card title="Search and sharing">
            <div className="grid gap-5">
              <div>
                <label htmlFor="seo-title" className="field-label">
                  Search title
                </label>
                <input
                  id="seo-title"
                  value={seoTitle}
                  maxLength={70}
                  onChange={(event) => {
                    setSeoTitle(event.target.value);
                    touch();
                  }}
                  className="field-input"
                />
                <p className="field-help">Leave empty to use the page title. Aim for under 60 characters.</p>
              </div>
              <div>
                <label htmlFor="seo-description" className="field-label">
                  Search description
                </label>
                <textarea
                  id="seo-description"
                  value={seoDescription}
                  maxLength={200}
                  rows={3}
                  onChange={(event) => {
                    setSeoDescription(event.target.value);
                    touch();
                  }}
                  className="field-input"
                />
                <p className="field-help">{seoDescription.length} of about 160 characters.</p>
              </div>
              <div>
                <label htmlFor="og-image" className="field-label">
                  Sharing image
                </label>
                <MediaPicker
                  id="og-image"
                  value={ogImageId}
                  onChange={(next) => {
                    setOgImageId(next);
                    touch();
                  }}
                />
                <p className="field-help">Shown when the page is shared on WhatsApp, LinkedIn and other platforms.</p>
              </div>
              <label htmlFor="noindex" className="flex min-h-11 cursor-pointer items-center gap-3">
                <input
                  id="noindex"
                  type="checkbox"
                  checked={noindex}
                  onChange={(event) => {
                    setNoindex(event.target.checked);
                    touch();
                  }}
                  className="size-5 shrink-0 accent-[var(--color-primary)]"
                />
                <span className="font-semibold text-navy">Hide this page from search engines</span>
              </label>
            </div>
          </Card>

          {id && revisions.length > 0 && (
            <Card title="Published versions" description="Restoring copies a version into your draft. Nothing goes live until you publish.">
              <ul className="grid gap-2">
                {revisions.map((revision, i) => (
                  <li key={revision.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2">
                    <span className="min-w-0 text-sm">
                      <span className="block font-semibold text-navy">
                        {formatDateTime(revision.createdAt)}
                        {i === 0 && published && <span className="ml-2 text-xs text-success">Live</span>}
                      </span>
                      <span className="block truncate text-muted">{revision.email ?? revision.label}</span>
                    </span>
                    <ConfirmButton
                      label="Restore"
                      tone="neutral"
                      title="Restore this version?"
                      description="Your current draft will be replaced by this version. It will not go live until you publish."
                      confirmLabel="Restore into draft"
                      action={() => restoreRevisionAction(id, revision.id)}
                      onDone={() => {
                        setDirty(false);
                        window.location.reload();
                      }}
                    />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      {/* ---- sticky action bar ---- */}
      <div className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] border-t border-line bg-surface/95 backdrop-blur-sm lg:left-[17rem]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-10">
          <button type="button" disabled={pending} className="btn btn-primary btn-sm" onClick={() => save(true)}>
            {pending ? "Working" : published ? "Publish changes" : "Publish"}
          </button>
          <button type="button" disabled={pending} className="btn btn-secondary btn-sm" onClick={() => save(false)}>
            Save draft
          </button>
          <button
            type="button"
            disabled={pending}
            className="btn btn-quiet btn-sm"
            onClick={() => {
              // Open the tab during the click so pop-up blockers allow it, then point it at the saved draft.
              const tab = window.open("", "_blank");
              save(false, (pageId) => {
                if (tab) tab.location.href = `/admin/preview/${pageId}/`;
              });
            }}
          >
            Preview
          </button>
          {livePath && (
            <a href={livePath} target="_blank" rel="noopener noreferrer" className="btn btn-quiet btn-sm max-sm:hidden">
              View live<span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          <p role="status" aria-live="polite" className={cn("flex min-w-0 flex-[1_1_100%] items-center gap-1.5 text-sm font-semibold sm:flex-1", status?.tone === "error" ? "text-danger" : "text-success")}>
            {status && (status.tone === "error" ? <WarningCircleIcon weight="fill" className="size-5 shrink-0" /> : <CheckCircleIcon weight="fill" className="size-5 shrink-0" />)}
            <span className="min-w-0">{status?.text ?? (dirty ? <span className="font-normal text-muted">Unsaved changes</span> : null)}</span>
          </p>
        </div>
      </div>

      {/* ---- block catalogue ---- */}
      <Dialog.Root open={adding} onOpenChange={setAdding}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-navy/50 data-[state=open]:animate-[fade-in_0.2s_ease-out]" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-[var(--z-overlay)] flex max-h-[90dvh] flex-col rounded-t-2xl bg-surface shadow-lift outline-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[84dvh] sm:w-[min(46rem,94vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
              <Dialog.Title className="text-lg">Add a section</Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" aria-label="Close" className="grid size-11 place-items-center rounded-full text-navy hover:bg-sky">
                  <XIcon weight="bold" className="size-5" />
                </button>
              </Dialog.Close>
            </div>
            <ul className="grid gap-2 overflow-y-auto overscroll-contain p-4 sm:grid-cols-2 sm:p-6">
              {BLOCKS.map((block) => (
                <li key={block.type}>
                  <button
                    type="button"
                    className="h-full w-full rounded-xl border border-line p-3.5 text-left hover:border-primary hover:bg-sky"
                    onClick={() => {
                      const section: Section = { key: newKey(), type: block.type, data: defaultBlockData(block.type as BlockType), isHidden: false };
                      update([...sections, section]);
                      setOpenKey(section.key);
                      setAdding(false);
                    }}
                  >
                    <span className="block font-semibold text-navy">{block.label}</span>
                    <span className="mt-0.5 block text-sm text-muted">{block.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </MediaLibraryProvider>
  );
}

function IconButton({ label, disabled, danger, onClick, children }: { label: string; disabled?: boolean; danger?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn("grid size-11 shrink-0 place-items-center rounded-lg border border-line text-navy hover:border-navy disabled:opacity-35", danger && "hover:border-danger hover:text-danger")}
    >
      {children}
    </button>
  );
}
