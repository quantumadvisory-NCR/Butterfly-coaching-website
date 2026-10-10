/**
 * Admin-managed content types. Each declares its form once using the field
 * DSL; the list screen, edit form and server-side validation all derive from
 * it. Database mapping lives in entity-store.ts (server only).
 */
import type { DataOf, Field } from "@/lib/blocks/fields";
import type { Role } from "@/lib/db/schema";

const STATUS = [
  { value: "draft", label: "Draft (hidden from the site)" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived (hidden, kept for reference)" },
] as const;

const seo = [
  { type: "text", name: "seoTitle", label: "Search title", help: "Shown in Google and the browser tab. Leave empty to use the name.", maxLength: 70 },
  { type: "textarea", name: "seoDescription", label: "Search description", help: "One or two sentences, up to about 160 characters.", maxLength: 200, rows: 2 },
] as const satisfies readonly Field[];

/* ---- programmes ---------------------------------------------------------- */

const programmeFields = [
  { type: "text", name: "name", label: "Programme name", required: true, maxLength: 120 },
  { type: "text", name: "slug", label: "Short identifier", required: true, help: "Lower-case letters, numbers and hyphens. Used internally.", maxLength: 80 },
  { type: "text", name: "path", label: "Page address", required: true, help: "For example /level-1-acc-coach-program/. Changing this changes the public URL: add a redirect from the old address.", maxLength: 160 },
  {
    type: "select",
    name: "kind",
    label: "Type",
    options: [
      { value: "certification", label: "ICF credential pathway (has its own detail page)" },
      { value: "service", label: "Service (links to a page you build in Pages)" },
      { value: "corporate", label: "Corporate programme (links to a page you build in Pages)" },
    ],
  },
  { type: "select", name: "status", label: "Status", options: STATUS },
  { type: "boolean", name: "isFeatured", label: "Show on the homepage" },
  { type: "number", name: "position", label: "Order", help: "Lower numbers appear first.", min: 0, max: 999 },

  { type: "text", name: "levelLabel", label: "Level label", help: 'For example "Level 1".', maxLength: 40 },
  { type: "text", name: "credential", label: "ICF credential", help: "ACC, PCC or MCC.", maxLength: 12 },
  { type: "textarea", name: "tagline", label: "Tagline", maxLength: 200, rows: 2 },
  { type: "textarea", name: "summary", label: "Card summary", help: "Shown on programme cards.", maxLength: 300, rows: 3 },
  { type: "richtext", name: "descriptionHtml", label: "Description" },

  { type: "stringList", name: "audience", label: "Who it is for", itemLabel: "Audience" },
  { type: "stringList", name: "eligibility", label: "Eligibility", itemLabel: "Requirement" },
  { type: "stringList", name: "outcomes", label: "Learning outcomes", itemLabel: "Outcome" },
  { type: "stringList", name: "highlights", label: "Programme highlights", itemLabel: "Highlight" },

  { type: "number", name: "educationHours", label: "Coach education hours", help: "Leave empty if not confirmed. Empty facts are hidden on the site.", min: 0, max: 10000 },
  { type: "number", name: "mentoringHours", label: "Mentor coaching hours", min: 0, max: 10000 },
  { type: "number", name: "experienceHours", label: "Coaching experience hours", min: 0, max: 100000 },
  { type: "text", name: "duration", label: "Duration", help: 'For example "6 months".', maxLength: 80 },
  { type: "text", name: "format", label: "Format", help: 'For example "Live online".', maxLength: 80 },
  { type: "text", name: "languages", label: "Languages", maxLength: 80 },

  { type: "text", name: "feeText", label: "Fee", help: "Shown exactly as typed. Leave empty to hide the fees section.", maxLength: 80 },
  { type: "textarea", name: "feeNote", label: "Fee note", help: "Instalments, taxes, what is included.", maxLength: 400, rows: 2 },
  {
    type: "list",
    name: "cohorts",
    label: "Cohort dates",
    itemLabel: "Cohort",
    titleField: "label",
    fields: [
      { type: "text", name: "label", label: "Name", help: 'For example "January 2027 cohort".', maxLength: 80 },
      { type: "date", name: "startDate", label: "Start date", required: true },
      { type: "date", name: "endDate", label: "End date" },
      { type: "text", name: "schedule", label: "Schedule", help: 'For example "Saturdays, 10am to 1pm IST".', maxLength: 160 },
      { type: "text", name: "note", label: "Note", maxLength: 200 },
      { type: "boolean", name: "isOpen", label: "Open for enrolment" },
    ],
  },

  {
    type: "select",
    name: "accreditationStatus",
    label: "ICF accreditation status",
    help: 'The ICF badge is shown only when this is "Accredited".',
    options: [
      { value: "accredited", label: "Accredited (verified)" },
      { value: "in_progress", label: "Accreditation in progress" },
      { value: "unverified", label: "Not yet verified" },
      { value: "not_applicable", label: "Not applicable" },
    ],
  },
  { type: "textarea", name: "accreditationNote", label: "Accreditation note", help: "Optional public note shown under the description.", maxLength: 300, rows: 2 },
  { type: "image", name: "badgeId", label: "ICF badge" },
  { type: "image", name: "heroImageId", label: "Page image" },
  { type: "image", name: "cardImageId", label: "Card image" },
  { type: "file", name: "brochureId", label: "Brochure (PDF)" },

  {
    type: "list",
    name: "modules",
    label: "Curriculum: the journey, step by step",
    itemLabel: "Step",
    titleField: "title",
    fields: [
      { type: "text", name: "title", label: "Title", required: true, maxLength: 120 },
      { type: "textarea", name: "description", label: "Description", maxLength: 500, rows: 2 },
      { type: "text", name: "hoursLabel", label: "Hours label", help: 'For example "77 hours". Optional.', maxLength: 40 },
    ],
  },
  { type: "references", name: "facultyIds", label: "Faculty", to: "faculty" },
  {
    type: "list",
    name: "faqs",
    label: "Programme FAQs",
    itemLabel: "Question",
    titleField: "question",
    fields: [
      { type: "text", name: "question", label: "Question", required: true, maxLength: 200 },
      { type: "richtext", name: "answerHtml", label: "Answer", required: true },
    ],
  },
  ...seo,
] as const satisfies readonly Field[];

/* ---- faculty ------------------------------------------------------------- */

const facultyFields = [
  { type: "text", name: "name", label: "Name", required: true, maxLength: 120 },
  { type: "text", name: "slug", label: "Short identifier", required: true, maxLength: 80 },
  { type: "text", name: "credential", label: "Credential", help: 'For example "PCC (ICF)". Only verified credentials.', maxLength: 60 },
  { type: "text", name: "roleTitle", label: "Role", maxLength: 120 },
  { type: "textarea", name: "shortBio", label: "Short biography", help: "Two or three sentences.", maxLength: 500, rows: 4 },
  { type: "richtext", name: "bioHtml", label: "Full biography" },
  { type: "image", name: "photoId", label: "Photograph", help: "Use a real photograph of this person, with their consent." },
  { type: "url", name: "linkedinUrl", label: "LinkedIn profile" },
  { type: "boolean", name: "isFounder", label: "This is the founder" },
  { type: "number", name: "position", label: "Order", min: 0, max: 999 },
  { type: "select", name: "status", label: "Status", options: STATUS },
] as const satisfies readonly Field[];

/* ---- testimonials -------------------------------------------------------- */

const testimonialFields = [
  { type: "text", name: "name", label: "Name", required: true, maxLength: 120 },
  { type: "text", name: "roleTitle", label: "Role", maxLength: 120 },
  { type: "text", name: "organisation", label: "Organisation", maxLength: 120 },
  { type: "textarea", name: "quote", label: "Testimonial, in the person's own words", required: true, maxLength: 3000, rows: 7 },
  {
    type: "textarea",
    name: "excerpt",
    label: "Short extract",
    help: "Optional. One or two sentences copied exactly from the testimonial above, for compact layouts. It is never reworded.",
    maxLength: 400,
    rows: 3,
  },
  { type: "image", name: "photoId", label: "Photograph" },
  { type: "url", name: "videoUrl", label: "Video link" },
  { type: "reference", name: "programmeId", label: "Related programme", to: "programme" },
  {
    type: "select",
    name: "status",
    label: "Approval",
    help: "Only approved testimonials appear on the site.",
    options: [
      { value: "pending", label: "Pending approval" },
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Rejected" },
    ],
  },
  { type: "boolean", name: "isFeatured", label: "Feature on the homepage" },
  { type: "number", name: "position", label: "Order", min: 0, max: 999 },
  { type: "textarea", name: "sourceNote", label: "Internal note", help: "Where this came from and who gave consent. Never shown publicly.", maxLength: 500, rows: 2 },
] as const satisfies readonly Field[];

/* ---- FAQs ---------------------------------------------------------------- */

const faqFields = [
  { type: "text", name: "question", label: "Question", required: true, maxLength: 200 },
  { type: "richtext", name: "answerHtml", label: "Answer", required: true },
  {
    type: "text",
    name: "groupKey",
    label: "Group",
    required: true,
    help: 'FAQ blocks show one group. Existing groups: home, programmes, mentoring, corporate. Type a new name to start a new group.',
    maxLength: 40,
  },
  { type: "number", name: "position", label: "Order", min: 0, max: 999 },
  { type: "select", name: "status", label: "Status", options: STATUS },
] as const satisfies readonly Field[];

/* ---- blog ---------------------------------------------------------------- */

const postFields = [
  { type: "text", name: "title", label: "Title", required: true, maxLength: 160 },
  { type: "text", name: "slug", label: "Address", required: true, help: "The article is published at /your-address/. Lower-case letters, numbers and hyphens.", maxLength: 120 },
  { type: "textarea", name: "excerpt", label: "Summary", help: "Shown on the blog index and in search results.", maxLength: 300, rows: 3 },
  { type: "richtext", name: "contentHtml", label: "Article" },
  { type: "image", name: "featuredImageId", label: "Featured image" },
  { type: "text", name: "authorName", label: "Author", maxLength: 120 },
  { type: "select", name: "status", label: "Status", options: STATUS },
  { type: "date", name: "publishedAt", label: "Publication date", help: "Leave empty to use today when you publish." },
  { type: "references", name: "categoryIds", label: "Categories", to: "category" },
  { type: "references", name: "tagIds", label: "Tags", to: "tag" },
  ...seo,
] as const satisfies readonly Field[];

const categoryFields = [
  { type: "text", name: "name", label: "Name", required: true, maxLength: 80 },
  { type: "text", name: "slug", label: "Address", required: true, help: "Used in /blog/category/your-address/.", maxLength: 80 },
  { type: "textarea", name: "description", label: "Description", maxLength: 300, rows: 2 },
] as const satisfies readonly Field[];

const tagFields = [
  { type: "text", name: "name", label: "Name", required: true, maxLength: 80 },
  { type: "text", name: "slug", label: "Address", required: true, help: "Used in /blog/tag/your-address/.", maxLength: 80 },
] as const satisfies readonly Field[];

/* ---- resources and redirects --------------------------------------------- */

const resourceFields = [
  { type: "text", name: "title", label: "Title", required: true, maxLength: 160 },
  { type: "textarea", name: "description", label: "Description", maxLength: 400, rows: 3 },
  { type: "file", name: "fileId", label: "File to download" },
  { type: "image", name: "coverId", label: "Cover image" },
  { type: "select", name: "status", label: "Status", options: STATUS },
  { type: "number", name: "position", label: "Order", min: 0, max: 999 },
] as const satisfies readonly Field[];

const redirectFields = [
  { type: "text", name: "sourcePath", label: "Old address", required: true, help: "The path visitors used to visit, e.g. /old-page/.", maxLength: 300 },
  { type: "url", name: "destination", label: "New address", required: true, placeholder: "/new-page/" },
  {
    type: "select",
    name: "statusCode",
    label: "Type",
    options: [
      { value: "301", label: "Permanent (301): the page has moved for good" },
      { value: "302", label: "Temporary (302): the page will come back" },
    ],
  },
  { type: "boolean", name: "isActive", label: "Active" },
  { type: "text", name: "note", label: "Note", maxLength: 200 },
] as const satisfies readonly Field[];

/* ---- registry ------------------------------------------------------------ */

export type EntityData = {
  programmes: DataOf<typeof programmeFields>;
  faculty: DataOf<typeof facultyFields>;
  testimonials: DataOf<typeof testimonialFields>;
  faqs: DataOf<typeof faqFields>;
  posts: DataOf<typeof postFields>;
  categories: DataOf<typeof categoryFields>;
  tags: DataOf<typeof tagFields>;
  resources: DataOf<typeof resourceFields>;
  redirects: DataOf<typeof redirectFields>;
};

export type EntityKey = keyof EntityData;

export type FormGroup = { title: string; description?: string; fields: string[] };

export type EntityConfig = {
  key: EntityKey;
  /** URL segment under /admin/. */
  route: string;
  label: string;
  singular: string;
  description: string;
  minRole: Role;
  deleteRole: Role;
  fields: readonly Field[];
  /** Splits a long form into titled cards. Fields not listed fall into "Details". */
  groups?: FormGroup[];
  /** Defaults for a new record, on top of the per-field defaults. */
  defaults?: Record<string, unknown>;
};

export const ENTITIES: Record<EntityKey, EntityConfig> = {
  programmes: {
    key: "programmes",
    route: "programmes",
    label: "Programmes",
    singular: "programme",
    description: "Changes appear on programme pages and cards across the site as soon as you save.",
    minRole: "editor",
    deleteRole: "admin",
    fields: programmeFields,
    defaults: { status: "draft", isFeatured: false, position: 10, accreditationStatus: "unverified" },
    groups: [
      { title: "Basics", fields: ["name", "slug", "path", "kind", "status", "isFeatured", "position"] },
      { title: "Overview", fields: ["levelLabel", "credential", "tagline", "summary", "descriptionHtml"] },
      { title: "Audience and outcomes", fields: ["audience", "eligibility", "outcomes", "highlights"] },
      {
        title: "Hours and format",
        description: "Only enter figures you have verified. Anything left empty is simply not shown.",
        fields: ["educationHours", "mentoringHours", "experienceHours", "duration", "format", "languages"],
      },
      { title: "Fees and dates", fields: ["feeText", "feeNote", "cohorts"] },
      { title: "Accreditation", fields: ["accreditationStatus", "accreditationNote", "badgeId"] },
      { title: "Images and brochure", fields: ["heroImageId", "cardImageId", "brochureId"] },
      { title: "Curriculum, faculty and FAQs", fields: ["modules", "facultyIds", "faqs"] },
      { title: "Search engines", fields: ["seoTitle", "seoDescription"] },
    ],
  },
  faculty: {
    key: "faculty",
    route: "faculty",
    label: "Faculty",
    singular: "profile",
    description: "The founder and faculty shown on the About page and programme pages.",
    minRole: "editor",
    deleteRole: "admin",
    fields: facultyFields,
    defaults: { status: "published", position: 10 },
  },
  testimonials: {
    key: "testimonials",
    route: "testimonials",
    label: "Testimonials",
    singular: "testimonial",
    description: "Student stories. Only approved testimonials are shown publicly.",
    minRole: "editor",
    deleteRole: "admin",
    fields: testimonialFields,
    defaults: { status: "pending", position: 50 },
  },
  faqs: {
    key: "faqs",
    route: "faqs",
    label: "FAQs",
    singular: "question",
    description: "Questions shown by FAQ blocks. Programme-specific questions are edited on each programme.",
    minRole: "editor",
    deleteRole: "editor",
    fields: faqFields,
    defaults: { status: "published", groupKey: "home", position: 50 },
  },
  posts: {
    key: "posts",
    route: "blog",
    label: "Blog",
    singular: "article",
    description: "Articles for Resources and insights.",
    minRole: "editor",
    deleteRole: "admin",
    fields: postFields,
    defaults: { status: "draft", authorName: "Butterfly Coaching Academy" },
    groups: [
      { title: "Article", fields: ["title", "slug", "excerpt", "contentHtml", "featuredImageId"] },
      { title: "Publishing", fields: ["status", "publishedAt", "authorName", "categoryIds", "tagIds"] },
      { title: "Search engines", fields: ["seoTitle", "seoDescription"] },
    ],
  },
  categories: {
    key: "categories",
    route: "blog-categories",
    label: "Blog categories",
    singular: "category",
    description: "Broad sections of the blog.",
    minRole: "editor",
    deleteRole: "admin",
    fields: categoryFields,
  },
  tags: {
    key: "tags",
    route: "blog-tags",
    label: "Blog tags",
    singular: "tag",
    description: "Topics an article touches on.",
    minRole: "editor",
    deleteRole: "admin",
    fields: tagFields,
  },
  resources: {
    key: "resources",
    route: "resources",
    label: "Resources",
    singular: "resource",
    description: "Downloadable guides and brochures shown by the Resource downloads block.",
    minRole: "editor",
    deleteRole: "admin",
    fields: resourceFields,
    defaults: { status: "draft", position: 10 },
  },
  redirects: {
    key: "redirects",
    route: "redirects",
    label: "Redirects",
    singular: "redirect",
    description: "Send visitors and search engines from an old address to a new one.",
    minRole: "admin",
    deleteRole: "admin",
    fields: redirectFields,
    defaults: { statusCode: "301", isActive: true },
  },
};

export function entityByRoute(route: string): EntityConfig | undefined {
  return Object.values(ENTITIES).find((entity) => entity.route === route);
}
