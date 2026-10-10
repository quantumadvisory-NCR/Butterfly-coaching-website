/**
 * Database schema. This file is the single source of truth: SQL migrations in
 * supabase/migrations are generated from it with `npm run db:generate`.
 */
import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigserial,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { ENQUIRY_TYPES } from "../validation/form-constants";

const id =() => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const ROLES = ["owner", "admin", "editor"] as const;
export const CONTENT_STATUS = ["draft", "published", "archived"] as const;

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

/** Staff accounts. In Supabase mode `id` equals auth.users.id. */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    fullName: text("full_name").notNull().default(""),
    role: text("role", { enum: ROLES }).notNull().default("editor"),
    isActive: boolean("is_active").notNull().default(true),
    lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("profiles_email_key").on(sql`lower(${t.email})`),
    check("profiles_role_check", sql`${t.role} in ('owner','admin','editor')`),
  ],
);

/** Password hashes for local development mode only. Unused with Supabase Auth. */
export const localCredentials = pgTable("local_credentials", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
  updatedAt: updatedAt(),
});

/* -------------------------------------------------------------------------- */
/* Media                                                                      */
/* -------------------------------------------------------------------------- */

export const MEDIA_KINDS = ["image", "video", "file"] as const;
export const MEDIA_SOURCES = ["bca", "stock", "ai", "upload"] as const;
export const MEDIA_STORAGE = ["static", "local", "supabase", "external"] as const;

export const media = pgTable(
  "media",
  {
    id: id(),
    kind: text("kind", { enum: MEDIA_KINDS }).notNull().default("image"),
    /** Provenance: authentic BCA asset, licensed stock, AI-generated or admin upload. */
    source: text("source", { enum: MEDIA_SOURCES }).notNull().default("upload"),
    storage: text("storage", { enum: MEDIA_STORAGE }).notNull().default("static"),
    /** Storage key (bucket path or disk path). Null for static and external assets. */
    storageKey: text("storage_key"),
    url: text("url").notNull(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull().default("image/jpeg"),
    sizeBytes: integer("size_bytes"),
    width: integer("width"),
    height: integer("height"),
    alt: text("alt").notNull().default(""),
    caption: text("caption"),
    credit: text("credit"),
    licence: text("licence"),
    sourceUrl: text("source_url"),
    /** Focal point (0..1) used for object-position when an image is cropped. */
    focalX: real("focal_x").notNull().default(0.5),
    focalY: real("focal_y").notNull().default(0.5),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("media_kind_idx").on(t.kind), index("media_created_idx").on(t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/* Pages                                                                      */
/* -------------------------------------------------------------------------- */

export const pages = pgTable(
  "pages",
  {
    id: id(),
    title: text("title").notNull(),
    /** Public URL path with leading and trailing slash, e.g. "/about-us/". */
    path: text("path").notNull(),
    status: text("status", { enum: CONTENT_STATUS }).notNull().default("draft"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    ogImageId: uuid("og_image_id").references(() => media.id, { onDelete: "set null" }),
    noindex: boolean("noindex").notNull().default(false),
    /** Snapshot the public site renders. Null until first publish. */
    publishedRevisionId: uuid("published_revision_id"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    hasUnpublishedChanges: boolean("has_unpublished_changes").notNull().default(true),
    /** Required pages cannot be deleted, only edited or unpublished. */
    isSystem: boolean("is_system").notNull().default(false),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("pages_path_key").on(t.path),
    index("pages_status_idx").on(t.status),
    check("pages_status_check", sql`${t.status} in ('draft','published','archived')`),
    check("pages_path_check", sql`${t.path} ~ '^/([a-z0-9-]+/)*$'`),
  ],
);

/** Working copy of a page's sections. Published content lives in revisions. */
export const pageSections = pgTable(
  "page_sections",
  {
    id: id(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    position: integer("position").notNull().default(0),
    /** Block configuration. Validated against the block's Zod schema on write. */
    data: jsonb("data").notNull().default({}),
    isHidden: boolean("is_hidden").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("page_sections_page_idx").on(t.pageId, t.position)],
);

export const REVISION_ENTITIES = ["page", "programme", "post"] as const;

export const revisions = pgTable(
  "revisions",
  {
    id: id(),
    entityType: text("entity_type", { enum: REVISION_ENTITIES }).notNull(),
    entityId: uuid("entity_id").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    label: text("label").notNull().default("save"),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("revisions_entity_idx").on(t.entityType, t.entityId, t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/* Faculty                                                                    */
/* -------------------------------------------------------------------------- */

export const faculty = pgTable(
  "faculty",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    roleTitle: text("role_title").notNull().default(""),
    credential: text("credential"),
    shortBio: text("short_bio").notNull().default(""),
    bioHtml: text("bio_html").notNull().default(""),
    photoId: uuid("photo_id").references(() => media.id, { onDelete: "set null" }),
    linkedinUrl: text("linkedin_url"),
    isFounder: boolean("is_founder").notNull().default(false),
    position: integer("position").notNull().default(0),
    status: text("status", { enum: CONTENT_STATUS }).notNull().default("published"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("faculty_slug_key").on(t.slug)],
);

/* -------------------------------------------------------------------------- */
/* Programmes                                                                 */
/* -------------------------------------------------------------------------- */

export const PROGRAMME_KINDS = ["certification", "service", "corporate"] as const;
export const ACCREDITATION_STATUS = ["accredited", "in_progress", "unverified", "not_applicable"] as const;

export const programmes = pgTable(
  "programmes",
  {
    id: id(),
    slug: text("slug").notNull(),
    /** Public URL. Certification programmes render a detail page here. */
    path: text("path").notNull(),
    kind: text("kind", { enum: PROGRAMME_KINDS }).notNull().default("certification"),
    name: text("name").notNull(),
    /** Short label shown above the name, e.g. "Level 1". */
    levelLabel: text("level_label"),
    /** ICF credential the pathway leads toward, e.g. "ACC". */
    credential: text("credential"),
    tagline: text("tagline").notNull().default(""),
    summary: text("summary").notNull().default(""),
    descriptionHtml: text("description_html").notNull().default(""),
    audience: jsonb("audience").$type<string[]>().notNull().default([]),
    eligibility: jsonb("eligibility").$type<string[]>().notNull().default([]),
    outcomes: jsonb("outcomes").$type<string[]>().notNull().default([]),
    highlights: jsonb("highlights").$type<string[]>().notNull().default([]),
    /** Leave null when unverified: the public site hides empty facts. */
    educationHours: numeric("education_hours", { precision: 6, scale: 1 }).$type<string | null>(),
    mentoringHours: numeric("mentoring_hours", { precision: 6, scale: 1 }).$type<string | null>(),
    experienceHours: integer("experience_hours"),
    duration: text("duration"),
    format: text("format"),
    languages: text("languages"),
    feeText: text("fee_text"),
    feeNote: text("fee_note"),
    accreditationStatus: text("accreditation_status", { enum: ACCREDITATION_STATUS })
      .notNull()
      .default("unverified"),
    accreditationNote: text("accreditation_note"),
    badgeId: uuid("badge_id").references(() => media.id, { onDelete: "set null" }),
    heroImageId: uuid("hero_image_id").references(() => media.id, { onDelete: "set null" }),
    cardImageId: uuid("card_image_id").references(() => media.id, { onDelete: "set null" }),
    brochureId: uuid("brochure_id").references(() => media.id, { onDelete: "set null" }),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    status: text("status", { enum: CONTENT_STATUS }).notNull().default("draft"),
    isFeatured: boolean("is_featured").notNull().default(true),
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("programmes_slug_key").on(t.slug),
    uniqueIndex("programmes_path_key").on(t.path),
    index("programmes_status_idx").on(t.status, t.position),
    check("programmes_status_check", sql`${t.status} in ('draft','published','archived')`),
  ],
);

/** Curriculum steps or modules, in order. */
export const programmeModules = pgTable(
  "programme_modules",
  {
    id: id(),
    programmeId: uuid("programme_id")
      .notNull()
      .references(() => programmes.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    hoursLabel: text("hours_label"),
  },
  (t) => [index("programme_modules_idx").on(t.programmeId, t.position)],
);

export const cohorts = pgTable(
  "cohorts",
  {
    id: id(),
    programmeId: uuid("programme_id")
      .notNull()
      .references(() => programmes.id, { onDelete: "cascade" }),
    label: text("label").notNull().default(""),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    schedule: text("schedule"),
    note: text("note"),
    isOpen: boolean("is_open").notNull().default(true),
  },
  (t) => [index("cohorts_programme_idx").on(t.programmeId, t.startDate)],
);

export const programmeFaculty = pgTable(
  "programme_faculty",
  {
    programmeId: uuid("programme_id")
      .notNull()
      .references(() => programmes.id, { onDelete: "cascade" }),
    facultyId: uuid("faculty_id")
      .notNull()
      .references(() => faculty.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.programmeId, t.facultyId] })],
);

/* -------------------------------------------------------------------------- */
/* FAQs and testimonials                                                      */
/* -------------------------------------------------------------------------- */

export const faqs = pgTable(
  "faqs",
  {
    id: id(),
    question: text("question").notNull(),
    answerHtml: text("answer_html").notNull(),
    /** Grouping key selected by FAQ blocks, e.g. "home", "programmes". */
    groupKey: text("group_key").notNull().default("general"),
    programmeId: uuid("programme_id").references(() => programmes.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    status: text("status", { enum: CONTENT_STATUS }).notNull().default("published"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("faqs_group_idx").on(t.groupKey, t.position), index("faqs_programme_idx").on(t.programmeId)],
);

export const TESTIMONIAL_STATUS = ["pending", "approved", "rejected"] as const;

export const testimonials = pgTable(
  "testimonials",
  {
    id: id(),
    name: text("name").notNull(),
    roleTitle: text("role_title"),
    organisation: text("organisation"),
    quote: text("quote").notNull(),
    /** Optional one or two sentence excerpt for compact layouts. */
    excerpt: text("excerpt"),
    photoId: uuid("photo_id").references(() => media.id, { onDelete: "set null" }),
    videoUrl: text("video_url"),
    programmeId: uuid("programme_id").references(() => programmes.id, { onDelete: "set null" }),
    /** Only approved testimonials are ever shown publicly. */
    status: text("status", { enum: TESTIMONIAL_STATUS }).notNull().default("pending"),
    isFeatured: boolean("is_featured").notNull().default(false),
    position: integer("position").notNull().default(0),
    sourceNote: text("source_note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("testimonials_status_idx").on(t.status, t.position),
    check("testimonials_status_check", sql`${t.status} in ('pending','approved','rejected')`),
  ],
);

/* -------------------------------------------------------------------------- */
/* Blog                                                                       */
/* -------------------------------------------------------------------------- */

export const posts = pgTable(
  "posts",
  {
    id: id(),
    title: text("title").notNull(),
    /** Posts are served at /{slug}/ to preserve the legacy WordPress URLs. */
    slug: text("slug").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    contentHtml: text("content_html").notNull().default(""),
    featuredImageId: uuid("featured_image_id").references(() => media.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull().default("Butterfly Coaching Academy"),
    status: text("status", { enum: CONTENT_STATUS }).notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("posts_slug_key").on(t.slug),
    index("posts_status_idx").on(t.status, t.publishedAt),
    check("posts_status_check", sql`${t.status} in ('draft','published','archived')`),
    check("posts_slug_check", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
  },
  (t) => [uniqueIndex("categories_slug_key").on(t.slug)],
);

export const tags = pgTable(
  "tags",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (t) => [uniqueIndex("tags_slug_key").on(t.slug)],
);

export const postCategories = pgTable(
  "post_categories",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.categoryId] })],
);

export const postTags = pgTable(
  "post_tags",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })],
);

/* -------------------------------------------------------------------------- */
/* Downloadable resources                                                     */
/* -------------------------------------------------------------------------- */

export const resources = pgTable("resources", {
  id: id(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  fileId: uuid("file_id").references(() => media.id, { onDelete: "set null" }),
  coverId: uuid("cover_id").references(() => media.id, { onDelete: "set null" }),
  status: text("status", { enum: CONTENT_STATUS }).notNull().default("draft"),
  position: integer("position").notNull().default(0),
  downloadCount: integer("download_count").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* -------------------------------------------------------------------------- */
/* Navigation, settings, redirects                                            */
/* -------------------------------------------------------------------------- */

export const MENUS = ["header", "footer_programmes", "footer_company", "footer_legal"] as const;

export const navigationItems = pgTable(
  "navigation_items",
  {
    id: id(),
    menu: text("menu", { enum: MENUS }).notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => navigationItems.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    href: text("href").notNull(),
    description: text("description"),
    position: integer("position").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    openInNewTab: boolean("open_in_new_tab").notNull().default(false),
  },
  (t) => [index("navigation_menu_idx").on(t.menu, t.position)],
);

/** Key/value store for global settings. Each value is validated by a Zod schema. */
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedBy: uuid("updated_by").references(() => profiles.id, { onDelete: "set null" }),
  updatedAt: updatedAt(),
});

export const redirects = pgTable(
  "redirects",
  {
    id: id(),
    sourcePath: text("source_path").notNull(),
    destination: text("destination").notNull(),
    statusCode: integer("status_code").notNull().default(301),
    isActive: boolean("is_active").notNull().default(true),
    note: text("note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("redirects_source_key").on(t.sourcePath),
    check("redirects_status_check", sql`${t.statusCode} in (301, 302, 307, 308)`),
  ],
);

/* -------------------------------------------------------------------------- */
/* Leads                                                                      */
/* -------------------------------------------------------------------------- */

// Defined in form-constants so the public forms can use it without bundling this file.
export { ENQUIRY_TYPES };
export const ENQUIRY_STATUS = ["new", "in_progress", "contacted", "qualified", "closed", "spam"] as const;

export const enquiries = pgTable(
  "enquiries",
  {
    id: id(),
    type: text("type", { enum: ENQUIRY_TYPES }).notNull().default("general"),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    organisation: text("organisation"),
    roleTitle: text("role_title"),
    programmeId: uuid("programme_id").references(() => programmes.id, { onDelete: "set null" }),
    programmeInterest: text("programme_interest"),
    teamSize: text("team_size"),
    message: text("message").notNull().default(""),
    consentMarketing: boolean("consent_marketing").notNull().default(false),
    sourcePath: text("source_path"),
    referrer: text("referrer"),
    utm: jsonb("utm").$type<Record<string, string>>(),
    status: text("status", { enum: ENQUIRY_STATUS }).notNull().default("new"),
    assignedTo: uuid("assigned_to").references(() => profiles.id, { onDelete: "set null" }),
    notificationStatus: text("notification_status").notNull().default("pending"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("enquiries_status_idx").on(t.status, t.createdAt),
    index("enquiries_created_idx").on(t.createdAt),
    check(
      "enquiries_status_check",
      sql`${t.status} in ('new','in_progress','contacted','qualified','closed','spam')`,
    ),
  ],
);

export const enquiryNotes = pgTable(
  "enquiry_notes",
  {
    id: id(),
    enquiryId: uuid("enquiry_id")
      .notNull()
      .references(() => enquiries.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("enquiry_notes_idx").on(t.enquiryId, t.createdAt)],
);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: id(),
    email: text("email").notNull(),
    name: text("name"),
    status: text("status", { enum: ["subscribed", "unsubscribed"] })
      .notNull()
      .default("subscribed"),
    sourcePath: text("source_path"),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull().defaultNow(),
    unsubscribeToken: uuid("unsubscribe_token").notNull().defaultRandom(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("newsletter_email_key").on(sql`lower(${t.email})`)],
);

/* -------------------------------------------------------------------------- */
/* Operations                                                                 */
/* -------------------------------------------------------------------------- */

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorId: uuid("actor_id"),
    actorEmail: text("actor_email"),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    summary: text("summary").notNull().default(""),
    meta: jsonb("meta"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_logs_created_idx").on(t.createdAt)],
);

/** Fixed-window counters for rate limiting sensitive endpoints. */
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);

/* -------------------------------------------------------------------------- */
/* Row types                                                                  */
/* -------------------------------------------------------------------------- */

export type Profile = typeof profiles.$inferSelect;
export type Role = (typeof ROLES)[number];
export type Media = typeof media.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type PageSection = typeof pageSections.$inferSelect;
export type Revision = typeof revisions.$inferSelect;
export type Faculty = typeof faculty.$inferSelect;
export type Programme = typeof programmes.$inferSelect;
export type ProgrammeModule = typeof programmeModules.$inferSelect;
export type Cohort = typeof cohorts.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type NavigationItem = typeof navigationItems.$inferSelect;
export type Redirect = typeof redirects.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type EnquiryNote = typeof enquiryNotes.$inferSelect;
export type Subscriber = typeof newsletterSubscribers.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
