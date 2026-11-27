/**
 * The admin's search (Ctrl+K) and its live new-enquiry count. Served by GET
 * route handlers (src/app/api/admin/search and /pulse) rather than server
 * actions, so the browser can cancel a stale search and neither ever waits in
 * the router's queue behind a save. Callers check the sign-in first.
 */
import "server-only";
import { count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";

export type SearchHit = { group: string; title: string; detail: string; href: string };

const PER_GROUP = 4;

/** Escapes LIKE wildcards so a search for "100%" means the text "100%". */
const pattern = (query: string) => `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

/** Content matching what was typed, a few per kind. Fewer than two characters finds nothing. */
export async function searchAdmin(query: string): Promise<SearchHit[]> {
  const q = query.trim().slice(0, 80);
  if (q.length < 2) return [];
  const like = pattern(q);
  const database = db();
  const [pages, programmes, posts, faculty, testimonials, faqs, resources, enquiries, media] = await Promise.all([
    database.select({ id: s.pages.id, title: s.pages.title, path: s.pages.path }).from(s.pages).where(or(ilike(s.pages.title, like), ilike(s.pages.path, like))).orderBy(s.pages.title).limit(PER_GROUP),
    database.select({ id: s.programmes.id, name: s.programmes.name, level: s.programmes.levelLabel }).from(s.programmes).where(or(ilike(s.programmes.name, like), ilike(s.programmes.slug, like))).orderBy(s.programmes.name).limit(PER_GROUP),
    database.select({ id: s.posts.id, title: s.posts.title, status: s.posts.status }).from(s.posts).where(ilike(s.posts.title, like)).orderBy(desc(s.posts.createdAt)).limit(PER_GROUP),
    database.select({ id: s.faculty.id, name: s.faculty.name, role: s.faculty.roleTitle }).from(s.faculty).where(ilike(s.faculty.name, like)).orderBy(s.faculty.name).limit(PER_GROUP),
    database
      .select({ id: s.testimonials.id, name: s.testimonials.name, organisation: s.testimonials.organisation })
      .from(s.testimonials)
      .where(or(ilike(s.testimonials.name, like), ilike(s.testimonials.organisation, like)))
      .limit(PER_GROUP),
    database.select({ id: s.faqs.id, question: s.faqs.question }).from(s.faqs).where(ilike(s.faqs.question, like)).orderBy(s.faqs.question).limit(PER_GROUP),
    database.select({ id: s.resources.id, title: s.resources.title }).from(s.resources).where(ilike(s.resources.title, like)).limit(PER_GROUP),
    database
      .select({ id: s.enquiries.id, name: s.enquiries.name, email: s.enquiries.email })
      .from(s.enquiries)
      .where(or(ilike(s.enquiries.name, like), ilike(s.enquiries.email, like)))
      .orderBy(desc(s.enquiries.createdAt))
      .limit(PER_GROUP),
    database.select({ filename: s.media.filename, alt: s.media.alt }).from(s.media).where(or(ilike(s.media.filename, like), ilike(s.media.alt, like))).orderBy(desc(s.media.createdAt)).limit(PER_GROUP),
  ]);
  const hits: SearchHit[] = [
    ...pages.map((p) => ({ group: "Pages", title: p.title, detail: p.path, href: `/admin/pages/${p.id}/` })),
    ...programmes.map((p) => ({ group: "Programmes", title: p.name, detail: p.level ?? "Programme", href: `/admin/programmes/${p.id}/` })),
    ...posts.map((p) => ({ group: "Blog", title: p.title, detail: p.status === "published" ? "Published article" : "Draft article", href: `/admin/blog/${p.id}/` })),
    ...faculty.map((f) => ({ group: "Faculty", title: f.name, detail: f.role ?? "Faculty", href: `/admin/faculty/${f.id}/` })),
    ...testimonials.map((t) => ({ group: "Testimonials", title: t.name, detail: t.organisation ?? "Testimonial", href: `/admin/testimonials/${t.id}/` })),
    ...faqs.map((f) => ({ group: "FAQs", title: f.question, detail: "FAQ", href: `/admin/faqs/${f.id}/` })),
    ...resources.map((r) => ({ group: "Resources", title: r.title, detail: "Resource", href: `/admin/resources/${r.id}/` })),
    ...enquiries.map((e) => ({ group: "Enquiries", title: e.name, detail: e.email, href: `/admin/enquiries/${e.id}/` })),
    ...media.map((m) => ({ group: "Media", title: m.alt || m.filename, detail: m.filename, href: `/admin/media/?q=${encodeURIComponent(m.filename)}` })),
  ];
  return hits;
}

/** How many enquiries are still marked new. */
export async function newEnquiryCount(): Promise<number> {
  const [row] = await db().select({ n: count() }).from(s.enquiries).where(eq(s.enquiries.status, "new"));
  return row?.n ?? 0;
}
