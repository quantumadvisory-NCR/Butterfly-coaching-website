import sanitizeHtml from "sanitize-html";

const SAFE_SCHEMES = ["http", "https", "mailto", "tel"];

/**
 * Sanitises rich text from the editor before it is stored. Anything the
 * editor cannot produce (scripts, styles, event handlers, iframes) is removed.
 */
export function sanitiseRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "h2", "h3", "h4", "ul", "ol", "li", "strong", "em", "u", "s", "a", "blockquote", "br", "hr"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: SAFE_SCHEMES,
    allowProtocolRelative: false,
    transformTags: {
      b: "strong",
      i: "em",
      h1: "h2",
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const external = /^https?:\/\//i.test(href);
        const attributes: Record<string, string> = external ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };
        return { tagName, attribs: attributes };
      },
    },
  }).trim();
}

/** Plain text only: strips every tag. For names, messages and other free text. */
export function sanitisePlainText(text: string): string {
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}
