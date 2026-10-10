/**
 * Page builder blocks. Each block declares its editable fields once; the type,
 * validator and admin form are all derived from that declaration.
 * Renderers live in src/components/blocks and are keyed by `type`.
 */
import { type DataOf, type Field, collectMediaIds, defaultsFor, mapRichText, objectSchema } from "./fields";

const link = <N extends string>(name: N, label: string, help?: string) => ({ type: "link", name, label, help }) as const;

/** Options every block shares. */
const shared = [
  {
    type: "select",
    name: "background",
    label: "Background",
    options: [
      { value: "white", label: "White" },
      { value: "sky", label: "Pale blue" },
    ],
  },
  {
    type: "text",
    name: "anchor",
    label: "Anchor ID",
    help: "Optional. Lets you link straight to this section, e.g. /about-us/#faculty.",
    maxLength: 40,
  },
] as const satisfies readonly Field[];

/* ---- field sets ---------------------------------------------------------- */

const hero = [
  {
    type: "select",
    name: "variant",
    label: "Layout",
    options: [
      { value: "home", label: "Homepage hero (large, split)" },
      { value: "page", label: "Page header (compact)" },
    ],
  },
  { type: "text", name: "eyebrow", label: "Small label above the heading", maxLength: 60 },
  { type: "text", name: "heading", label: "Heading", required: true, maxLength: 90 },
  { type: "textarea", name: "subheading", label: "Supporting statement", maxLength: 320, rows: 3 },
  link("primaryCta", "Primary button"),
  link("secondaryCta", "Secondary button"),
  { type: "image", name: "image", label: "Image" },
  {
    type: "image",
    name: "imageTall",
    label: "Tall image for wide screens",
    help: "Optional portrait crop shown beside the heading on laptops and desktops. Leave empty to reuse the main image.",
  },
] as const satisfies readonly Field[];

const richText = [
  { type: "text", name: "heading", label: "Heading", maxLength: 120 },
  { type: "richtext", name: "body", label: "Text", required: true },
] as const satisfies readonly Field[];

const imageText = [
  { type: "text", name: "heading", label: "Heading", required: true, maxLength: 120 },
  { type: "richtext", name: "body", label: "Text" },
  { type: "stringList", name: "bullets", label: "Bullet points", itemLabel: "Point" },
  link("cta", "Button"),
  { type: "image", name: "image", label: "Image" },
  {
    type: "select",
    name: "imageSide",
    label: "Image position on wide screens",
    options: [
      { value: "right", label: "Right" },
      { value: "left", label: "Left" },
    ],
  },
] as const satisfies readonly Field[];

const pathCards = [
  { type: "text", name: "heading", label: "Heading", required: true, maxLength: 120 },
  { type: "textarea", name: "intro", label: "Introduction", maxLength: 300, rows: 2 },
  {
    type: "list",
    name: "items",
    label: "Pathways",
    itemLabel: "Pathway",
    titleField: "title",
    max: 4,
    fields: [
      { type: "text", name: "title", label: "Title", required: true, maxLength: 60 },
      { type: "textarea", name: "body", label: "Description", maxLength: 240, rows: 3 },
      link("link", "Link"),
      { type: "image", name: "image", label: "Image" },
    ],
  },
] as const satisfies readonly Field[];

const featureList = [
  { type: "text", name: "heading", label: "Heading", required: true, maxLength: 120 },
  { type: "textarea", name: "intro", label: "Introduction", maxLength: 400, rows: 3 },
  {
    type: "list",
    name: "items",
    label: "Points",
    itemLabel: "Point",
    titleField: "title",
    max: 8,
    fields: [
      { type: "text", name: "title", label: "Title", required: true, maxLength: 80 },
      { type: "textarea", name: "body", label: "Description", maxLength: 400, rows: 3 },
    ],
  },
  { type: "image", name: "image", label: "Image", help: "Optional. Shown beside the list on wide screens." },
  link("cta", "Button"),
] as const satisfies readonly Field[];

const programmeCards = [
  { type: "text", name: "heading", label: "Heading", required: true, maxLength: 120 },
  { type: "textarea", name: "intro", label: "Introduction", maxLength: 400, rows: 3 },
  {
    type: "select",
    name: "source",
    label: "Which programmes to show",
    help: "Programme details come from Programmes in the admin menu.",
    options: [
      { value: "featured", label: "Featured programmes" },
      { value: "certification", label: "ICF credential pathways only" },
      { value: "all", label: "All published programmes" },
    ],
  },
  link("cta", "Button"),
] as const satisfies readonly Field[];

const comparisonTable = [
  { type: "text", name: "heading", label: "Heading", required: true, maxLength: 120 },
  { type: "textarea", name: "intro", label: "Introduction", maxLength: 400, rows: 3 },
  {
    type: "select",
    name: "source",
    label: "Content",
    options: [
      { value: "programmes", label: "Compare ICF credential pathways automatically" },
      { value: "custom", label: "Custom table (use the columns and rows below)" },
    ],
  },
  { type: "stringList", name: "columns", label: "Column headings (custom table)", itemLabel: "Column" },
  {
    type: "list",
    name: "rows",
    label: "Rows (custom table)",
    itemLabel: "Row",
    titleField: "label",
    fields: [
      { type: "text", name: "label", label: "Row heading", required: true, maxLength: 80 },
      { type: "stringList", name: "values", label: "Values, one per column", itemLabel: "Value" },
    ],
  },
  { type: "textarea", name: "footnote", label: "Footnote", maxLength: 400, rows: 2 },
] as const satisfies readonly Field[];

const testimonials = [
  { type: "text", name: "heading", label: "Heading", required: true, maxLength: 120 },
  { type: "textarea", name: "intro", label: "Introduction", maxLength: 300, rows: 2 },
  {
    type: "select",
    name: "source",
    label: "Which testimonials to show",
    help: "Only approved testimonials are ever shown.",
    options: [
      { value: "featured", label: "Featured testimonials" },
      { value: "all", label: "All approved testimonials" },
    ],
  },
  { type: "number", name: "limit", label: "Maximum to show", min: 1, max: 60 },
  link("cta", "Button"),
] as const satisfies readonly Field[];

const profiles = [
  { type: "text", name: "heading", label: "Heading", required: true, maxLength: 120 },
  { type: "textarea", name: "intro", label: "Introduction", maxLength: 500, rows: 3 },
  {
    type: "select",
    name: "source",
    label: "Who to show",
    help: "Profiles come from Faculty in the admin menu.",
    options: [
      { value: "founder", label: "Founder feature" },
      { value: "faculty", label: "Faculty (everyone except the founder)" },
      { value: "all", label: "Founder and faculty" },
    ],
  },
  {
    type: "list",
    name: "facts",
    label: "Founder facts",
    itemLabel: "Fact",
    titleField: "label",
    max: 4,
    fields: [
      { type: "text", name: "value", label: "Figure", required: true, maxLength: 20 },
      { type: "text", name: "label", label: "What it measures", required: true, maxLength: 80 },
    ],
  },
  link("cta", "Button"),
] as const satisfies readonly Field[];

const faq = [
  { type: "text", name: "heading", label: "Heading", required: true, maxLength: 120 },
  { type: "textarea", name: "intro", label: "Introduction", maxLength: 300, rows: 2 },
  {
    type: "reference",
    name: "group",
    to: "faqGroup",
    label: "FAQ group",
    help: "Questions come from FAQs in the admin menu.",
  },
  link("cta", "Button"),
] as const satisfies readonly Field[];

const timeline = [
  { type: "text", name: "heading", label: "Heading", required: true, maxLength: 120 },
  { type: "textarea", name: "intro", label: "Introduction", maxLength: 400, rows: 3 },
  {
    type: "list",
    name: "steps",
    label: "Steps",
    itemLabel: "Step",
    titleField: "title",
    max: 8,
    fields: [
      {
        type: "text",
        name: "marker",
        label: "Marker",
        help: "Optional letter or short label. Leave empty to number the steps.",
        maxLength: 3,
      },
      { type: "text", name: "title", label: "Title", required: true, maxLength: 60 },
      { type: "textarea", name: "body", label: "Description", maxLength: 320, rows: 3 },
    ],
  },
] as const satisfies readonly Field[];

const gallery = [
  { type: "text", name: "heading", label: "Heading", maxLength: 120 },
  { type: "textarea", name: "intro", label: "Introduction", maxLength: 300, rows: 2 },
  {
    type: "list",
    name: "images",
    label: "Images",
    itemLabel: "Image",
    titleField: "caption",
    max: 40,
    fields: [
      { type: "image", name: "image", label: "Image" },
      { type: "text", name: "caption", label: "Caption", maxLength: 140 },
    ],
  },
] as const satisfies readonly Field[];

const video = [
  { type: "text", name: "heading", label: "Heading", maxLength: 120 },
  { type: "textarea", name: "intro", label: "Introduction", maxLength: 300, rows: 2 },
  {
    type: "list",
    name: "videos",
    label: "Videos",
    itemLabel: "Video",
    titleField: "title",
    max: 12,
    fields: [
      { type: "text", name: "title", label: "Title", required: true, maxLength: 120 },
      { type: "url", name: "url", label: "YouTube link", required: true, placeholder: "https://www.youtube.com/watch?v=..." },
    ],
  },
] as const satisfies readonly Field[];

const cta = [
  { type: "text", name: "heading", label: "Heading", required: true, maxLength: 120 },
  { type: "textarea", name: "body", label: "Text", maxLength: 300, rows: 2 },
  link("primaryCta", "Primary button"),
  link("secondaryCta", "Secondary button", 'Use "whatsapp" as the link to open WhatsApp with the number from Site settings.'),
] as const satisfies readonly Field[];

const contactForm = [
  { type: "text", name: "heading", label: "Heading", required: true, maxLength: 120 },
  { type: "textarea", name: "intro", label: "Introduction", maxLength: 400, rows: 3 },
  {
    type: "select",
    name: "formType",
    label: "Form",
    options: [
      { value: "general", label: "General enquiry" },
      { value: "programme", label: "Programme enquiry" },
      { value: "corporate", label: "Corporate enquiry" },
      { value: "mentoring", label: "Mentoring and supervision enquiry" },
      { value: "coaching", label: "Coaching enquiry" },
      { value: "discovery_call", label: "Discovery call request" },
    ],
  },
  { type: "boolean", name: "showDetails", label: "Show phone, email, WhatsApp and address beside the form" },
] as const satisfies readonly Field[];

const newsletter = [
  { type: "text", name: "heading", label: "Heading", required: true, maxLength: 120 },
  { type: "textarea", name: "body", label: "Text", maxLength: 300, rows: 2 },
] as const satisfies readonly Field[];

const resourceDownloads = [
  { type: "text", name: "heading", label: "Heading", required: true, maxLength: 120 },
  { type: "textarea", name: "intro", label: "Introduction", maxLength: 300, rows: 2 },
] as const satisfies readonly Field[];

const trustStrip = [
  { type: "text", name: "heading", label: "Heading", maxLength: 120 },
  {
    type: "list",
    name: "logos",
    label: "Logos or badges",
    itemLabel: "Logo",
    titleField: "name",
    max: 10,
    fields: [
      { type: "image", name: "image", label: "Logo image" },
      { type: "text", name: "name", label: "Name (read aloud by screen readers)", required: true, maxLength: 80 },
    ],
  },
  {
    type: "list",
    name: "facts",
    label: "Facts",
    itemLabel: "Fact",
    titleField: "label",
    max: 4,
    fields: [
      { type: "text", name: "value", label: "Figure", required: true, maxLength: 20 },
      { type: "text", name: "label", label: "What it measures", required: true, maxLength: 80 },
    ],
  },
] as const satisfies readonly Field[];

const blogTeasers = [
  { type: "text", name: "heading", label: "Heading", required: true, maxLength: 120 },
  { type: "textarea", name: "intro", label: "Introduction", maxLength: 300, rows: 2 },
  { type: "number", name: "limit", label: "Number of articles", min: 1, max: 6 },
  link("cta", "Button"),
] as const satisfies readonly Field[];

/* ---- registry ------------------------------------------------------------ */

type Shared = DataOf<typeof shared>;

export type BlockData = {
  hero: DataOf<typeof hero> & Shared;
  rich_text: DataOf<typeof richText> & Shared;
  image_text: DataOf<typeof imageText> & Shared;
  path_cards: DataOf<typeof pathCards> & Shared;
  feature_list: DataOf<typeof featureList> & Shared;
  programme_cards: DataOf<typeof programmeCards> & Shared;
  comparison_table: DataOf<typeof comparisonTable> & Shared;
  testimonials: DataOf<typeof testimonials> & Shared;
  profiles: DataOf<typeof profiles> & Shared;
  faq: DataOf<typeof faq> & Shared;
  timeline: DataOf<typeof timeline> & Shared;
  gallery: DataOf<typeof gallery> & Shared;
  video: DataOf<typeof video> & Shared;
  cta: DataOf<typeof cta> & Shared;
  contact_form: DataOf<typeof contactForm> & Shared;
  newsletter: DataOf<typeof newsletter> & Shared;
  resource_downloads: DataOf<typeof resourceDownloads> & Shared;
  trust_strip: DataOf<typeof trustStrip> & Shared;
  blog_teasers: DataOf<typeof blogTeasers> & Shared;
};

export type BlockType = keyof BlockData;

export type BlockDefinition = {
  type: BlockType;
  label: string;
  description: string;
  fields: readonly Field[];
};

const define = (type: BlockType, label: string, description: string, fields: readonly Field[]): BlockDefinition => ({
  type,
  label,
  description,
  fields: [...fields, ...shared],
});

export const BLOCKS: readonly BlockDefinition[] = [
  define("hero", "Hero", "Large opening section with heading, buttons and an image.", hero),
  define("rich_text", "Rich text", "Headings, paragraphs, lists and links.", richText),
  define("image_text", "Image and text", "Text beside an image, with optional bullet points.", imageText),
  define("path_cards", "Pathway cards", "Up to four image cards that route visitors to the right place.", pathCards),
  define("feature_list", "Feature list", "A short list of points, with an optional image.", featureList),
  define("programme_cards", "Programme cards", "Cards generated from your programmes.", programmeCards),
  define("comparison_table", "Comparison table", "Compare the ICF pathways, or build a custom table.", comparisonTable),
  define("testimonials", "Testimonials", "Approved student stories.", testimonials),
  define("profiles", "Founder and faculty", "Profiles from the Faculty list.", profiles),
  define("faq", "FAQ accordion", "Expandable questions from an FAQ group.", faq),
  define("timeline", "Timeline", "A sequence of steps, such as the learning journey.", timeline),
  define("gallery", "Gallery", "A grid of photographs with captions.", gallery),
  define("video", "Video", "YouTube videos that load only when played.", video),
  define("cta", "Call to action", "A bold closing section with one or two buttons.", cta),
  define("contact_form", "Contact form", "An enquiry form, optionally with contact details.", contactForm),
  define("newsletter", "Newsletter signup", "Email signup form.", newsletter),
  define("resource_downloads", "Resource downloads", "Published downloadable resources.", resourceDownloads),
  define("trust_strip", "Trust strip", "Accreditation badges, logos and key facts.", trustStrip),
  define("blog_teasers", "Latest articles", "The most recent blog posts.", blogTeasers),
];

const byType = new Map(BLOCKS.map((b) => [b.type, b]));

export function getBlock(type: string): BlockDefinition | undefined {
  return byType.get(type as BlockType);
}

export function isBlockType(type: string): type is BlockType {
  return byType.has(type as BlockType);
}

export function defaultBlockData(type: BlockType): Record<string, unknown> {
  const block = byType.get(type)!;
  return defaultsFor(block.fields);
}

export type ValidationResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; errors: { path: string; message: string }[] };

/** Validates (and normalises) a block's data. Rich text is passed through `sanitise`. */
export function validateBlockData(
  type: string,
  input: unknown,
  sanitise: (html: string) => string = (html) => html,
): ValidationResult {
  const block = getBlock(type);
  if (!block) return { ok: false, errors: [{ path: "type", message: `Unknown block type "${type}".` }] };
  const parsed = objectSchema(block.fields).safeParse(input ?? {});
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    };
  }
  const data = mapRichText(block.fields, parsed.data, sanitise) as Record<string, unknown>;
  return { ok: true, data };
}

/** Media ids referenced anywhere in a set of sections. Used for "in use" checks. */
export function mediaIdsInSections(sections: { type: string; data: unknown }[]): Set<string> {
  const ids = new Set<string>();
  for (const section of sections) {
    const block = getBlock(section.type);
    if (block) collectMediaIds(block.fields, section.data, ids);
  }
  return ids;
}
