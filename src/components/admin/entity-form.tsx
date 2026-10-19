"use client";

import { CheckCircleIcon, FloppyDiskIcon, TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { deleteEntityAction, saveEntityAction } from "@/app/admin/actions/content";
import type { MediaView } from "@/app/admin/actions/operations";
import { ENTITIES, type EntityKey } from "@/lib/admin/entities";
import type { Field } from "@/lib/blocks/fields";
import { cn } from "@/lib/utils";
import { ConfirmButton } from "./confirm-button";
import { FieldRenderer, type RefOptions } from "./field-renderer";
import { MediaLibraryProvider } from "./media-picker";
import { Card } from "./ui";

type Props = {
  entityKey: EntityKey;
  id: string | null;
  initial: Record<string, unknown>;
  refOptions: RefOptions;
  media: MediaView[];
  canDelete: boolean;
  /** Public address of this record, if it has one and is published. */
  publicHref?: string | null;
  /** True straight after this record was created. */
  justSaved?: boolean;
};

/** The edit screen for any content type declared in lib/admin/entities.ts. */
export function EntityForm({ entityKey, id, initial, refOptions, media, canDelete, publicHref, justSaved }: Props) {
  const config = ENTITIES[entityKey];
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(justSaved ? { tone: "success", text: "Saved." } : null);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const statusRef = useRef<HTMLParagraphElement>(null);

  // Warn before losing unsaved work.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const groups = useMemo(() => {
    const byName = new Map<string, Field>(config.fields.map((f) => [f.name, f]));
    const declared = config.groups ?? [];
    const used = new Set(declared.flatMap((g) => g.fields));
    const rest = config.fields.filter((f) => !used.has(f.name));
    return [
      ...(rest.length ? [{ title: declared.length ? "Details" : "", description: undefined as string | undefined, fields: rest }] : []),
      ...declared.map((g) => ({ title: g.title, description: g.description, fields: g.fields.map((name) => byName.get(name)).filter((f) => f !== undefined) })),
    ];
  }, [config]);

  const save = () =>
    startTransition(async () => {
      setStatus(null);
      const result = await saveEntityAction(entityKey, id, data);
      if (result.ok) {
        setErrors({});
        setDirty(false);
        setStatus({ tone: "success", text: result.message ?? "Saved." });
        if (!id) router.replace(`/admin/${config.route}/${result.id}/?saved=1`);
      } else {
        setErrors(result.errors ?? {});
        setStatus({ tone: "error", text: result.message });
        // Bring the first problem into view.
        requestAnimationFrame(() => {
          const first = document.querySelector<HTMLElement>('[aria-invalid="true"], .field-error');
          (first ?? statusRef.current)?.scrollIntoView({ block: "center", behavior: "smooth" });
        });
      }
    });

  const groupHasError = (fields: readonly Field[]) => fields.some((f) => Object.keys(errors).some((key) => key === f.name || key.startsWith(`${f.name}.`)));

  return (
    <MediaLibraryProvider initial={media}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        noValidate
        className="grid gap-5 pb-28"
      >
        {groups.map((group) => (
          <Card key={group.title || "main"} title={group.title || undefined} description={group.description} className={cn(groupHasError(group.fields) && "border-danger")}>
            <FieldRenderer
              fields={group.fields}
              value={data}
              onChange={(next) => {
                setData(next);
                setDirty(true);
              }}
              errors={errors}
              refOptions={refOptions}
            />
          </Card>
        ))}

        {/* Sticky action bar: always reachable, including on a phone. */}
        <div className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] border-t border-line bg-surface/95 backdrop-blur-sm lg:left-[17rem]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-10">
            <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
              <FloppyDiskIcon weight="bold" className="size-4" />
              {pending ? "Saving" : id ? "Save changes" : `Create ${config.singular}`}
            </button>
            {publicHref && (
              <a href={publicHref} target="_blank" rel="noopener noreferrer" className="btn btn-quiet btn-sm">
                View on site<span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
            <p ref={statusRef} role="status" aria-live="polite" className={cn("flex min-w-0 flex-1 items-center gap-1.5 text-sm font-semibold", status?.tone === "error" ? "text-danger" : "text-success")}>
              {status &&
                (status.tone === "error" ? <WarningCircleIcon weight="fill" className="size-5 shrink-0" /> : <CheckCircleIcon weight="fill" className="size-5 shrink-0" />)}
              <span className="truncate">{status?.text ?? (dirty ? <span className="font-normal text-muted">Unsaved changes</span> : null)}</span>
            </p>
            {id && canDelete && (
              <ConfirmButton
                label="Delete"
                icon={<TrashIcon weight="bold" className="size-4" />}
                title={`Delete this ${config.singular}?`}
                description="This cannot be undone. It will disappear from the website straight away."
                confirmLabel="Delete permanently"
                action={() => deleteEntityAction(entityKey, id)}
                onDone={() => {
                  setDirty(false);
                  router.push(`/admin/${config.route}/`);
                }}
              />
            )}
          </div>
        </div>
      </form>
    </MediaLibraryProvider>
  );
}
