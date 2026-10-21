/**
 * A small field DSL. One declaration drives three things for every block and
 * admin form: the TypeScript type, the Zod validator and the editing UI.
 */
import { z } from "zod";

// The site's Content-Security-Policy forbids eval. Zod tests for it once in the
// browser, which Chrome records as a policy violation, so skip the test there.
if (typeof window !== "undefined") z.config({ jitless: true });

type Base ={ name: string; label: string; help?: string; required?: boolean };

export type Option = { value: string; label: string };
export type ReferenceTarget = "faqGroup" | "programme" | "faculty" | "category" | "tag";

export type Field =
  | (Base & { type: "text"; maxLength?: number; placeholder?: string })
  | (Base & { type: "textarea"; maxLength?: number; rows?: number })
  | (Base & { type: "richtext" })
  | (Base & { type: "url"; placeholder?: string })
  | (Base & { type: "number"; min?: number; max?: number })
  | (Base & { type: "boolean" })
  | (Base & { type: "select"; options: readonly Option[] })
  | (Base & { type: "image" })
  | (Base & { type: "file" })
  | (Base & { type: "link" })
  | (Base & { type: "date" })
  | (Base & { type: "stringList"; itemLabel: string })
  | (Base & { type: "color" })
  | (Base & { type: "reference"; to: ReferenceTarget })
  | (Base & { type: "references"; to: ReferenceTarget })
  | (Base & { type: "list"; itemLabel: string; titleField?: string; fields: readonly Field[]; max?: number });

export type LinkValue = { label: string; href: string };

/* ---- type inference ------------------------------------------------------ */

type ValueOf<F> = F extends { type: "text" | "textarea" | "richtext" | "url" | "select" | "reference" | "date" | "color" }
  ? string
  : F extends { type: "number" }
    ? number | null
    : F extends { type: "boolean" }
      ? boolean
      : F extends { type: "image" | "file" }
        ? string | null
        : F extends { type: "link" }
          ? LinkValue
          : F extends { type: "stringList" | "references" }
            ? string[]
            : F extends { type: "list"; fields: infer Sub extends readonly Field[] }
              ? DataOf<Sub>[]
              : never;

export type DataOf<Fs extends readonly Field[]> = {
  [F in Fs[number] as F["name"]]: ValueOf<F>;
};

/* ---- validation ---------------------------------------------------------- */

const SAFE_HREF = /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i;

/** Shortcuts editors can type instead of a URL. Resolved by resolveHref() in lib/settings. */
export const SPECIAL_HREFS = ["booking", "whatsapp", "phone"] as const;

/** Relative paths, anchors, http(s), mailto, tel and the shortcuts above. Blocks javascript: and data: URLs. */
export const hrefSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => v === "" || SAFE_HREF.test(v) || (SPECIAL_HREFS as readonly string[]).includes(v.toLowerCase()),
    'Use a path like /contact-us/, a full https:// address, or one of the shortcuts "booking", "whatsapp" or "phone".',
  );

// .optional() lets the key be left out entirely; the transform then normalises it to null.
const uuidOrNull = z
  .union([z.string().uuid(), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v ? v : null));

function schemaFor(field: Field): z.ZodType {
  switch (field.type) {
    case "text":
    case "textarea": {
      const max = field.maxLength ?? (field.type === "text" ? 300 : 4000);
      const base = z.string().trim().max(max, `Keep this under ${max} characters.`);
      return field.required ? base.min(1, `${field.label} is required.`) : base.default("");
    }
    case "richtext": {
      const base = z.string().max(100_000);
      return field.required ? base.min(1, `${field.label} is required.`) : base.default("");
    }
    case "url":
      return field.required ? hrefSchema.min(1, `${field.label} is required.`) : hrefSchema.default("");
    case "date":
      return z
        .string()
        .trim()
        .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use the date picker.")
        .default("");
    case "number":
      return z
        .union([z.number(), z.string(), z.null()])
        .optional()
        .transform((v) => (v === "" || v === null || v === undefined ? null : Number(v)))
        .refine((v) => v === null || Number.isFinite(v), "Enter a number.")
        .refine((v) => v === null || field.min === undefined || v >= field.min, `Minimum is ${field.min}.`)
        .refine((v) => v === null || field.max === undefined || v <= field.max, `Maximum is ${field.max}.`);
    case "boolean":
      return z
        .union([z.boolean(), z.literal("on"), z.literal("true"), z.literal("false"), z.null()])
        .optional()
        .transform((v) => v === true || v === "on" || v === "true");
    case "select": {
      const values = field.options.map((o) => o.value);
      const first = values[0] ?? "";
      return z
        .string()
        .default(first)
        .transform((v) => (values.includes(v) ? v : first));
    }
    case "reference":
      return z.string().trim().max(120).default("");
    case "references":
      return z.array(z.string().uuid()).default([]);
    case "color":
      return z
        .string()
        .trim()
        .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour such as #2B2B2B.");
    case "image":
    case "file":
      return uuidOrNull;
    case "link":
      return z
        .object({ label: z.string().trim().max(80).default(""), href: hrefSchema.default("") })
        .default({ label: "", href: "" });
    case "stringList":
      return z
        .array(z.string().trim().max(600))
        .default([])
        .transform((items) => items.filter(Boolean));
    case "list": {
      const item = objectSchema(field.fields);
      const list = z.array(item).default([]);
      return field.max ? list.refine((v) => v.length <= field.max!, `At most ${field.max} items.`) : list;
    }
  }
}

export function objectSchema(fields: readonly Field[]) {
  const shape: Record<string, z.ZodType> = {};
  for (const field of fields) shape[field.name] = schemaFor(field);
  return z.object(shape);
}

/* ---- defaults ------------------------------------------------------------ */

export function defaultValue(field: Field): unknown {
  switch (field.type) {
    case "number":
      return null;
    case "boolean":
      return false;
    case "select":
      return field.options[0]?.value ?? "";
    case "image":
    case "file":
      return null;
    case "link":
      return { label: "", href: "" };
    case "stringList":
    case "references":
    case "list":
      return [];
    case "color":
      return "#000000";
    default:
      return "";
  }
}

export function defaultsFor(fields: readonly Field[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((f) => [f.name, defaultValue(f)]));
}

/** Collects every media id referenced by image/file fields, however deeply nested. */
export function collectMediaIds(fields: readonly Field[], data: unknown, into = new Set<string>()): Set<string> {
  if (!data || typeof data !== "object") return into;
  const record = data as Record<string, unknown>;
  for (const field of fields) {
    const value = record[field.name];
    if ((field.type === "image" || field.type === "file") && typeof value === "string" && value) into.add(value);
    if (field.type === "list" && Array.isArray(value)) {
      for (const item of value) collectMediaIds(field.fields, item, into);
    }
  }
  return into;
}

/** Field paths that hold rich text, so the server can sanitise them on save. */
export function mapRichText(fields: readonly Field[], data: unknown, fn: (html: string) => string): unknown {
  if (!data || typeof data !== "object") return data;
  const record = { ...(data as Record<string, unknown>) };
  for (const field of fields) {
    const value = record[field.name];
    if (field.type === "richtext" && typeof value === "string") record[field.name] = fn(value);
    if (field.type === "list" && Array.isArray(value)) {
      record[field.name] = value.map((item) => mapRichText(field.fields, item, fn));
    }
  }
  return record;
}
