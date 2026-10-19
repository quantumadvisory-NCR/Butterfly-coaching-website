/**
 * Read model for the public website. Everything here returns published
 * content only and is cached under one tag; any admin change calls
 * `revalidateContent()` to refresh the whole site.
 *
 * Results are plain JSON (dates as ISO strings) so they survive the cache.
 */
import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { DEFAULT_SETTINGS, type SettingsKey, SETTINGS_GROUPS, type SiteSettings, parseSettingsGroup } from "@/lib/settings";
import { normalisePath } from "@/lib/utils";

export const CONTENT_TAG = "content";

function cached<A extends unknown[], R>(key: string, fn: (...args: A) => Promise<R>) {
  return cache(unstable_cache(fn, ["bca", key], { tags: [CONTENT_TAG], revalidate: 3600 }));
}

/** During `next build` the database may be unreachable; fall back so the build still completes. */
async function buildSafe<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (process.env.NEXT_PHASE === "phase-production-build") return fallback;
    throw error;
  }
}

/* ---- types --------------------------------------------------------------- */

export type MediaItem = {
  id: string;
  kind: "image" | "video" | "file";
  url: string;
  alt: string;
  caption: string | null;
  width: number | null;
  height: number | null;
  focalX: number;
  focalY: number;
  mimeType: string;
  filename: string;
};
export type MediaMap = Record<string, MediaItem>;

export type SectionSnapshot = { id: string; type: string; data: Record<string, unknown>; isHidden: boolean };

export type PageSnapshot = {
  id: string;
  title: string;
  path: string;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageId: string | null;
  noindex: boolean;
  updatedAt: string;
  sections: SectionSnapshot[];
};

export type NavNode = {
  id: string;
  label: string;
  href: string;
  description: string | null;
  openInNewTab: boolean;
  children: NavNode[];
};
export type Navigation = Record<(typeof s.MENUS)[number], NavNode[]>;

export type ProgrammeView = Omit<s.Programme, "createdAt" | "updatedAt"> & {
  updatedAt: string;
  modules: Pick<s.ProgrammeModule, "id" | "title" | "description" | "hoursLabel">[];
  cohorts: Pick<s.Cohort, "id" | "label" | "startDate" | "endDate" | "schedule" | "note" | "isOpen">[];
  facultyIds: string[];
};

export type FacultyView = Omit<s.Faculty, "createdAt" | "updatedAt">;
export type TestimonialView = Omit<s.Testimonial, "createdAt" | "updatedAt" | "sourceNote">;
export type FaqView = Pick<s.Faq, "id" | "question" | "answerHtml" | "groupKey" | "programmeId">;
export type TermView = { id: string; name: string; slug: string };
export type PostView = Omit<s.Post, "createdAt" | "updatedAt" | "publishedAt"> & {
  publishedAt: string | null;
  updatedAt: string;
  categories: TermView[];
  tags: TermView[];
};
export type ResourceView = Pick<s.Resource, "id" | "title" | "description" | "fileId" | "coverId">;

/* ---- settings, navigation, media ---------------------------------------- */

/**
 * The stored settings rows, cached as they are in the database. They are parsed
 * after leaving the cache, never before: a cache entry written by an earlier
 * release must not decide the shape the current code receives (a new settings
 * group would otherwise be missing until the cache expired).
 */
const getStoredSettings = cached("settings-rows", async (): Promise<Record<string, unknown>> =>
  buildSafe(async () => {
    const rows = await db().select().from(s.siteSettings);
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }, {}),
);

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const stored = await getStoredSettings();
  if (!stored || typeof stored !== "object") return DEFAULT_SETTINGS;
  const out = {} as Record<SettingsKey, unknown>;
  for (const key of Object.keys(SETTINGS_GROUPS) as SettingsKey[]) {
    out[key] = parseSettingsGroup(key, (stored as Record<string, unknown>)[key]);
  }
  return out as SiteSettings;
});

const toMediaItem = (m: s.Media): MediaItem => ({
  id: m.id,
  kind: m.kind,
  url: m.url,
  alt: m.alt,
  caption: m.caption,
  width: m.width,
  height: m.height,
  focalX: m.focalX,
  focalY: m.focalY,
  mimeType: m.mimeType,
  filename: m.filename,
});

/** The whole media library keyed by id. Small enough to cache as one object. */
export const getMediaMap = cached("media", async (): Promise<MediaMap> =>
  buildSafe(async () => {
    const rows = await db().select().from(s.media);
    return Object.fromEntries(rows.map((m) => [m.id, toMediaItem(m)]));
  }, {}),
);

export const getNavigation = cached("navigation", async (): Promise<Navigation> =>
  buildSafe(
    async () => {
      const rows = await db()
        .select()
        .from(s.navigationItems)
        .where(eq(s.navigationItems.isVisible, true))
        .orderBy(asc(s.navigationItems.position));
      const node = (r: s.NavigationItem): NavNode => ({
        id: r.id,
        label: r.label,
        href: r.href,
        description: r.description,
        openInNewTab: r.openInNewTab,
        children: rows.filter((c) => c.parentId === r.id).map(node),
      });
      const nav = { header: [], footer_programmes: [], footer_company: [], footer_legal: [] } as Navigation;
      for (const row of rows) if (!row.parentId) nav[row.menu].push(node(row));
      return nav;
    },
    { header: [], footer_programmes: [], footer_company: [], footer_legal: [] },
  ),
);

/* ---- pages --------------------------------------------------------------- */

/** The published snapshot of a page, or null. Drafts are never returned. */
export const getPublishedPage = cached("page", async (path: string): Promise<PageSnapshot | null> => {
  const [row] = await db()
    .select({ page: s.pages, snapshot: s.revisions.snapshot })
    .from(s.pages)
    .innerJoin(s.revisions, eq(s.revisions.id, s.pages.publishedRevisionId))
    .where(and(eq(s.pages.path, path), eq(s.pages.status, "published")))
    .limit(1);
  if (!row) return null;
  const snap = row.snapshot as Partial<PageSnapshot>;
  return {
    id: row.page.id,
    path: row.page.path,
    title: snap.title ?? row.page.title,
    seoTitle: snap.seoTitle ?? null,
    seoDescription: snap.seoDescription ?? null,
    ogImageId: snap.ogImageId ?? null,
    noindex: snap.noindex ?? false,
    updatedAt: (row.page.publishedAt ?? row.page.updatedAt).toISOString(),
    sections: (snap.sections ?? []).filter((section) => !section.isHidden),
  };
});

export const getPublishedPagePaths = cached("page-paths", async () => {
  const rows = await db()
    .select({ path: s.pages.path, updatedAt: s.pages.publishedAt, noindex: s.pages.noindex })
    .from(s.pages)
    .where(eq(s.pages.status, "published"));
  return rows.map((r) => ({ path: r.path, noindex: r.noindex, updatedAt: r.updatedAt?.toISOString() ?? null }));
});

/* ---- programmes, faculty, testimonials, FAQs ----------------------------- */

export const getProgrammes = cached("programmes", async (): Promise<ProgrammeView[]> => {
  const rows = await db()
    .select()
    .from(s.programmes)
    .where(eq(s.programmes.status, "published"))
    .orderBy(asc(s.programmes.position));
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [modules, cohortRows, links] = await Promise.all([
    db().select().from(s.programmeModules).where(inArray(s.programmeModules.programmeId, ids)).orderBy(asc(s.programmeModules.position)),
    db().select().from(s.cohorts).where(inArray(s.cohorts.programmeId, ids)).orderBy(asc(s.cohorts.startDate)),
    db().select().from(s.programmeFaculty).where(inArray(s.programmeFaculty.programmeId, ids)).orderBy(asc(s.programmeFaculty.position)),
  ]);
  return rows.map(({ createdAt: _createdAt, updatedAt, ...p }) => ({
    ...p,
    updatedAt: updatedAt.toISOString(),
    modules: modules
      .filter((m) => m.programmeId === p.id)
      .map((m) => ({ id: m.id, title: m.title, description: m.description, hoursLabel: m.hoursLabel })),
    cohorts: cohortRows
      .filter((c) => c.programmeId === p.id)
      .map((c) => ({ id: c.id, label: c.label, startDate: c.startDate, endDate: c.endDate, schedule: c.schedule, note: c.note, isOpen: c.isOpen })),
    facultyIds: links.filter((l) => l.programmeId === p.id).map((l) => l.facultyId),
  }));
});

export const getFaculty = cached("faculty", async (): Promise<FacultyView[]> => {
  const rows = await db().select().from(s.faculty).where(eq(s.faculty.status, "published")).orderBy(asc(s.faculty.position));
  return rows.map(({ createdAt: _c, updatedAt: _u, ...f }) => f);
});

export const getTestimonials = cached("testimonials", async (): Promise<TestimonialView[]> => {
  const rows = await db()
    .select()
    .from(s.testimonials)
    .where(eq(s.testimonials.status, "approved"))
    .orderBy(asc(s.testimonials.position));
  return rows.map(({ createdAt: _c, updatedAt: _u, sourceNote: _n, ...t }) => t);
});

export const getFaqs = cached("faqs", async (): Promise<FaqView[]> => {
  const rows = await db().select().from(s.faqs).where(eq(s.faqs.status, "published")).orderBy(asc(s.faqs.position));
  return rows.map((f) => ({ id: f.id, question: f.question, answerHtml: f.answerHtml, groupKey: f.groupKey, programmeId: f.programmeId }));
});

export const getResources = cached("resources", async (): Promise<ResourceView[]> => {
  const rows = await db().select().from(s.resources).where(eq(s.resources.status, "published")).orderBy(asc(s.resources.position));
  return rows.map((r) => ({ id: r.id, title: r.title, description: r.description, fileId: r.fileId, coverId: r.coverId }));
});

/* ---- blog ---------------------------------------------------------------- */

export const getPosts = cached("posts", async (): Promise<PostView[]> => {
  const rows = await db().select().from(s.posts).where(eq(s.posts.status, "published")).orderBy(desc(s.posts.publishedAt));
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [cats, tagRows] = await Promise.all([
    db()
      .select({ postId: s.postCategories.postId, id: s.categories.id, name: s.categories.name, slug: s.categories.slug })
      .from(s.postCategories)
      .innerJoin(s.categories, eq(s.categories.id, s.postCategories.categoryId))
      .where(inArray(s.postCategories.postId, ids)),
    db()
      .select({ postId: s.postTags.postId, id: s.tags.id, name: s.tags.name, slug: s.tags.slug })
      .from(s.postTags)
      .innerJoin(s.tags, eq(s.tags.id, s.postTags.tagId))
      .where(inArray(s.postTags.postId, ids)),
  ]);
  const terms = (list: { postId: string; id: string; name: string; slug: string }[], postId: string) =>
    list.filter((t) => t.postId === postId).map(({ id, name, slug }) => ({ id, name, slug }));
  return rows.map(({ createdAt: _c, updatedAt, publishedAt, ...p }) => ({
    ...p,
    publishedAt: publishedAt?.toISOString() ?? null,
    updatedAt: updatedAt.toISOString(),
    categories: terms(cats, p.id),
    tags: terms(tagRows, p.id),
  }));
});

export function searchPosts(posts: PostView[], query: string): PostView[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
  if (terms.length === 0) return posts;
  return posts.filter((post) => {
    const haystack = `${post.title} ${post.excerpt} ${post.tags.map((t) => t.name).join(" ")} ${post.contentHtml.replace(/<[^>]*>/g, " ")}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

/* ---- redirects and path resolution -------------------------------------- */

export const getRedirects = cached("redirects", async () => {
  const rows = await db().select().from(s.redirects).where(eq(s.redirects.isActive, true));
  return Object.fromEntries(rows.map((r) => [r.sourcePath, { destination: r.destination, statusCode: r.statusCode }]));
});

export type Resolved =
  | { kind: "redirect"; destination: string; permanent: boolean }
  | { kind: "page"; page: PageSnapshot }
  | { kind: "programme"; programme: ProgrammeView }
  | { kind: "post"; post: PostView };

/**
 * Maps a request path to content. Order: redirect, CMS page, programme, post.
 * A CMS page at a programme's path wins, so a programme can be given a fully
 * custom page from the page builder.
 */
export const resolvePath = cache(async (rawPath: string): Promise<Resolved | null> => {
  const path = normalisePath(rawPath);

  const redirectMap = await getRedirects();
  const hit = redirectMap[path];
  if (hit && normalisePath(hit.destination) !== path) {
    return { kind: "redirect", destination: hit.destination, permanent: hit.statusCode === 301 || hit.statusCode === 308 };
  }

  const page = await getPublishedPage(path);
  if (page) return { kind: "page", page };

  const programme = (await getProgrammes()).find((p) => p.path === path && p.kind === "certification");
  if (programme) return { kind: "programme", programme };

  const segments = path.split("/").filter(Boolean);
  if (segments.length === 1) {
    const post = (await getPosts()).find((p) => p.slug === segments[0]);
    if (post) return { kind: "post", post };
  }
  return null;
});
