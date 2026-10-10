# Brand system

The visual system for the Butterfly Coaching Academy (BCA) website: where the palette comes from, the design tokens built on it, and the rules that keep every page consistent.

The design tokens live in one place, [`src/app/globals.css`](../src/app/globals.css). The five core colours and the typefaces can be changed without code in **Admin > Settings > Colours and typography**.

## 1. Where the palette comes from

The brief asked for a palette based on the colours the live iPEC website actually uses, with no guessed values. On 10 October 2026 the colours were read directly from `https://www.ipeccoaching.com/`:

- **Computed styles** of rendered elements on the homepage (buttons, links, headings, body text), read in a real browser.
- **Stylesheet source**: every hex and rgb value was extracted from iPEC's three own stylesheets and counted:
  - `template_main.min.css` (HubSpot template, 111 KB)
  - `template_theme-overrides.min.css` (theme settings, 18 KB)
  - `module_Main_Header.min.css`

iPEC's stylesheets define **no CSS custom properties**, so there are no variable names to cite. The values below are literal colours from those files.

### Verified iPEC colours

| Role | Hex | Evidence |
|---|---|---|
| Primary blue | `#0068bf` | Computed colour of links; background of blue sections; 6 uses in theme overrides |
| Navy (principal dark) | `#0f256a` | Computed text colour of every CTA button; input focus outline; 15 uses across both stylesheets |
| Deep navy | `#00326d` | 4 uses in theme overrides (gradient stops) |
| Yellow CTA accent | `#f5ba00` | Computed background of every `.cta_button`; link hover colour; 15 uses. `#f5bc00` also appears 12 times as a menu hover colour |
| Sky blue | `#4d9fd5` | 8 uses in theme overrides |
| Pale blue background | `#eff7ff` | Submenu hover background; 5 uses (`#eff7fe` 3 more) |
| Pale blue, deeper | `#d2e9fc` | 3 uses in theme overrides |
| Warm cream | `#faf3e3` | Form button hover background; 4 uses |
| Body text | `#444746` | Computed colour of `body`; 8 uses |
| Muted text | `#6c6c6c`, `#707070`, `#939393` | Stylesheet values; `#939393` computed on small labels |
| Borders | `#d0d0d0`, `#dedede` | 15 and 3 uses |
| Neutral surface | `#f5f5f5`, `#f1f1f1` | Stylesheet values |
| White | `#ffffff` | Computed background of `body` and header |
| Headings | `#000000` | Computed colour of `h1` and `h3` |

### Verified iPEC component details

| Detail | Value | Evidence |
|---|---|---|
| Typeface | Poppins 400 / 500 / 700 | Computed `font-family`; Google Fonts request |
| CTA button | Pill, `border-radius: 92px`, `padding: 10px 40px`, 16px / 500, yellow fill, navy text | Computed styles of `.cta_button` |
| CTA hover | White fill, navy text | `.cta_button.button:hover` rule |
| Link hover | `#f5ba00`; active `#ffff50` | `a:hover`, `a:active` rules |
| Input focus | `outline-color: #0f256a` | Form field rule |
| Content width | `max-width: 1164px` | `.content-wrapper` |
| Breakpoints | 767 / 768, 1024, 1139 | `@media` queries |

### What is *not* verified

- **Hover and focus states for BCA** are our own design decisions, informed by the above. They are not copies of iPEC's.
- **Section spacing and type scale** were not sampled from iPEC; they are original to this build.
- The values marked "derived" in the next section are computed from the verified colours (with `color-mix`) or chosen for accessibility. They are **not** iPEC colours and are labelled as such.

## 2. BCA design tokens

BCA uses iPEC's blue, navy and yellow family as its base. This suits BCA unusually well: the butterfly in BCA's own logo is `#FEC902`, almost the same yellow.

| Token | Value | Status | Used for |
|---|---|---|---|
| `--bca-primary` | `#0068bf` | Verified (iPEC primary blue) | Links, eyebrows, secondary highlights |
| `--bca-navy` | `#0f256a` | Verified (iPEC navy) | Headings, dark sections, footer, button text |
| `--bca-accent` | `#f5ba00` | Verified (iPEC CTA yellow) | Primary buttons, accent shapes, focus ring on dark |
| `--bca-sky` | `#eff7ff` | Verified (iPEC pale blue) | Alternating section background, hero |
| `--bca-ink` | `#444746` | Verified (iPEC body text) | Body copy |
| `--color-sky-deep` | `#d2e9fc` | Verified (iPEC) | Photo panels behind portrait cut-outs |
| `--color-cream` | `#faf3e3` | Verified (iPEC) | Reserved warm surface |
| `--color-line` | `#dedede` | Verified (iPEC) | Borders in the admin |
| `--color-mist` | `#f5f5f5` | Verified (iPEC) | Admin background |
| `--color-sky-line` | `#c3dcf3` | Derived (estimate) | Borders on pale blue and white sections |
| `--color-muted` | `#5f6362` | Derived (estimate) | Secondary text. Darker than iPEC's `#6c6c6c` so it passes AA on pale blue |
| `--color-primary-strong` | 82% primary + black | Derived | Text on pale blue badges |
| `--color-accent-strong` | 86% accent + brown | Derived | Reserved |
| `--color-danger` / `--color-success` | `#b3261e` / `#1c6b3f` | Original | Form errors and confirmations |
| WhatsApp button | `#0f7a5f` | Original | Darker than WhatsApp green so the white icon reaches 5.29 to 1 |

**Headings are navy, not black.** iPEC sets headings in `#000000`; BCA uses the verified navy instead so that headings carry the brand. This is a deliberate departure.

### Contrast (WCAG 2.2 AA)

| Pair | Ratio | Result |
|---|---|---|
| Navy text on accent yellow (primary button) | 7.97 to 1 | Pass |
| White on navy (dark sections, footer) | 14.07 to 1 | Pass |
| Body ink on white | 9.39 to 1 | Pass |
| Body ink on pale blue | 8.69 to 1 | Pass |
| Primary blue on white (links) | 5.63 to 1 | Pass |
| Primary blue on pale blue (eyebrows) | 5.20 to 1 | Pass |
| Muted text on white / pale blue | 6.09 / 5.63 to 1 | Pass |
| Accent yellow on navy (eyebrows on dark) | 7.97 to 1 | Pass |
| Navy headings on white / pale blue | 14.07 / 13.01 to 1 | Pass |
| Error text on white | 6.54 to 1 | Pass |
| Form field border on white (non-text, needs 3 to 1) | 3.28 to 1 | Pass |

Ratios are calculated with the WCAG relative-luminance formula. Yellow is **never** used for text on a light background (it would fail at 1.76 to 1). The admin's theme editor recalculates these ratios live and warns before a failing combination is saved.

## 3. Typography

| | Choice | Why |
|---|---|---|
| Headings and body | **Plus Jakarta Sans** (variable, self-hosted through `next/font`) | It is the typeface BCA's existing site already uses, so the rebuild keeps brand continuity. Like iPEC's Poppins it is a friendly geometric sans, but it is BCA's own rather than a copy |
| Alternates in the admin | Schibsted Grotesk, Manrope, Newsreader (serif, headings only) | Selectable in Settings. A font file is only downloaded if the active theme uses it |

Fluid type scale (`clamp()`, no breakpoint jumps):

| Token | Size range | Line height | Tracking |
|---|---|---|---|
| `text-display` | 2.5rem to 4.75rem | 1.02 | -0.035em |
| `text-h1` | 2.125rem to 3.5rem | 1.06 | -0.03em |
| `text-h2` | 1.75rem to 2.75rem | 1.12 | -0.025em |
| `text-h3` | 1.25rem to 1.5rem | 1.25 | -0.015em |
| `text-lead` | 1.0625rem to 1.25rem | 1.55 | normal |
| Body | 1rem | 1.65 | normal |

Body text never drops below 16px. Paragraphs are capped at about 68 characters per line.

## 4. Spacing, layout and shape

| Token | Value |
|---|---|
| `--gutter` | `clamp(1.25rem, 0.5rem + 3.4vw, 2.5rem)` page margin |
| `--section-space` | `clamp(3.75rem, 2.25rem + 5.6vw, 7rem)` vertical padding per section |
| `container-site` | 75rem (1200px) maximum, close to iPEC's 1164px |
| `container-prose` | 44rem for long-form text |
| `--header-height` | 4.25rem on phones, 4.75rem from 1024px |

**Shape rule (one rule, applied everywhere):**

- Buttons are pills.
- Cards and images use `--radius-card` (1.25rem).
- Form fields use `--radius-field` (0.75rem).
- Feature images take one large "wing" corner (`--radius-wing`, 7.5rem) on wide screens. This is BCA's signature shape, echoing a butterfly wing.

**Brand accent:** a solid sun-yellow disc tucked behind key photographs (hero, founder). No gradients, no glass effects.

**Layers:** z-index values come only from the documented scale (`--z-sticky`, `--z-header`, `--z-floating`, `--z-overlay`, `--z-toast`).

## 5. Interaction states

| State | Treatment |
|---|---|
| Primary button hover | Navy fill, white text (on dark sections: white fill, navy text) |
| Secondary button hover | Navy fill, white text |
| Pressed | 1px downward nudge |
| Link hover | Navy, underlined |
| Focus (keyboard) | 3px navy outline with 3px offset; accent yellow on dark sections. Never removed |
| Form field focus | Primary border plus a soft primary ring |
| Invalid field | Danger border, message below the field, linked with `aria-describedby` |

## 6. Motion

Restrained and purposeful:

- Hero text eases in once on load.
- Sections ease in as they enter the viewport, using CSS scroll-driven animations. No JavaScript, no scroll listeners.
- Cards lift slightly on hover; accordion panels animate their height.
- Everything is disabled under `prefers-reduced-motion`, and browsers without scroll-driven animation support simply show the content.

## 7. Logo

- **On dark backgrounds** (footer, admin): the official logo, unmodified. Yellow butterfly, white wordmark.
- **On light backgrounds** (header): the same artwork with the white lettering recoloured to navy `#0F256A`. The butterfly is untouched. The official file has no light-background version, so this variant **needs owner approval** before launch.
- **Mark only**: the butterfly, extracted from the official SVG, used as the favicon and as a quiet watermark on call-to-action sections.

The logo files are produced by `npm run images:optimise` from the official SVG. Nothing was redrawn.

## 8. Image direction

One consistent look across all generated photography: documentary, editorial, natural window light, pale blue and soft white interiors with a single warm yellow accent, Indian professionals in contemporary workwear, candid rather than posed. See [IMAGE_ASSETS.md](IMAGE_ASSETS.md) and [HIGGSFIELD_IMAGE_PROMPTS.md](HIGGSFIELD_IMAGE_PROMPTS.md).

## 9. What was deliberately not taken from iPEC

iPEC was a reference for quality, clarity and structure, not a template. Nothing was copied from it: no logo, artwork, photography, code or copy. BCA's layout, type choices, shape language, imagery and wording are original.
