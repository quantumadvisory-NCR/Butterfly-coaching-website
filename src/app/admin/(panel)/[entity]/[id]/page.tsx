import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityForm } from "@/components/admin/entity-form";
import { Notice, PageHeader } from "@/components/admin/ui";
import { UUID_RE } from "@/lib/admin/action-helpers";
import { mediaViews } from "@/lib/admin/editor-data";
import { entityByRoute } from "@/lib/admin/entities";
import { entityRow, loadEntity, referenceOptions } from "@/lib/admin/entity-store";
import { hasRole, requireUser } from "@/lib/auth";
import { defaultsFor } from "@/lib/blocks/fields";

type Props = { params: Promise<{ entity: string; id: string }>; searchParams: Promise<{ saved?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { entity, id } = await params;
  const config = entityByRoute(entity);
  return { title: config ? `${id === "new" ? "New" : "Edit"} ${config.singular}` : "Not found" };
}

/** Edit screen shared by every content type in lib/admin/entities.ts. */
export default async function EntityEditPage({ params, searchParams }: Props) {
  const [{ entity, id }, { saved }] = await Promise.all([params, searchParams]);
  const config = entityByRoute(entity);
  if (!config) notFound();
  const user = await requireUser(config.minRole);
  const isNew = id === "new";
  // An address that is not a record id would otherwise reach the database as an invalid uuid and fail with a server error.
  if (!isNew && !UUID_RE.test(id)) notFound();

  const [existing, refOptions, media, row] = await Promise.all([
    isNew ? null : loadEntity(config.key, id),
    referenceOptions(),
    mediaViews(),
    isNew ? null : entityRow(config.key, id),
  ]);
  if (!isNew && !existing) notFound();

  const initial = (existing as Record<string, unknown> | null) ?? { ...defaultsFor(config.fields), ...config.defaults };

  return (
    <>
      <PageHeader
        title={isNew ? `New ${config.singular}` : (row?.title ?? `Edit ${config.singular}`)}
        back={{ href: `/admin/${config.route}/`, label: config.label }}
      />
      {config.key === "programmes" && !isNew && (existing as { accreditationStatus?: string }).accreditationStatus === "unverified" && (existing as { kind?: string }).kind === "certification" && (
        <Notice tone="warning" className="mb-5">
          The ICF accreditation status of this programme has not been verified, so the site does not show an accreditation badge or claim for it. Set the status under
          Accreditation once you have confirmed it.
        </Notice>
      )}
      {config.key === "testimonials" && (
        <Notice className="mb-5">Only publish testimonials that are genuine and that the person has agreed to share. Never edit their words.</Notice>
      )}
      <EntityForm
        key={isNew ? "new" : id}
        entityKey={config.key}
        id={isNew ? null : id}
        initial={initial}
        refOptions={refOptions}
        media={media}
        canDelete={hasRole(user, config.deleteRole)}
        publicHref={row?.href ?? null}
        justSaved={Boolean(saved) && !isNew}
      />
    </>
  );
}
