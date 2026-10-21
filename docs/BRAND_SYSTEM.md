# Brand system

The visual system for the Butterfly Coaching Academy (BCA) website: where the palette comes from, the design tokens built on it, and the rules that keep every page consistent.

The design tokens live in one place, [`src/app/globals.css`](../src/app/globals.css). The five core colours and the typefaces can be changed without code in **Admin > Settings > Colours and typography**.

> **October 2026, later: gray and yellow, no blue.** At the owner's request the whole site and the admin use the palette of the October 2026 design refresh: charcoal `#2B2B2B` for headings, links and dark sections (the "Choose your path" panel, featured stories, the closing call to action, the footer and the admin sidebar), mid gray `#5F5F5F` for body text, light gray `#F2F2F0` for panels, white cards, butterfly yellow `#F5BA00` for buttons and highlights, and deep yellow for small labels. The page background stays the logo's grey-white `#FCFCFC`. Section 2 lists the current tokens; the notes below about blue and navy are history.
>
> **October 2026: the logo's grey-white replaces cream.** The principal background of the public site *and* the admin is **`#FCFCFC`** (rgb 252, 252, 252), the grey-white behind the official BCA logo artwork, set by `--bca-background` / `--color-background` / `--color-page`. It replaced the cream `#F7EFE2` of the first redesign, which had itself replaced the pale-blue page and section backgrounds (`#eff7ff`, `#d2e9fc`, `#c3dcf3`). The neutrals (tints, borders) now derive from the logo's grey `#4B4B4D` rather than a warm brown, and cards are pure white. Blue survives only as a restrained text accent (links, the second line of the homepage headline). Sections do not alternate colours: every standard section sits on the page background, cards and forms are white, and navy is kept for the "Choose your path" panel, featured stories, the closing call to action and the footer. Section 2 below lists the current tokens; sections 1 and 2's iPEC evidence is kept for the history of the palette.

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

BCA first used iPEC's blue, navy and yellow family. Since October 2026 the blue and navy are replaced by charcoal and grays; the yellow stays, and it is almost the butterfly's own `#FEC902`.

| Token | Value | Used for |
|---|---|---|
| `--bca-navy` (Admin: "Headings and dark sections") | Charcoal `#2b2b2b` | Headings, dark sections, the footer, the admin sidebar, button text on yellow |
| `--bca-primary` (Admin: "Links and secondary buttons") | Charcoal `#2b2b2b` | Links, secondary buttons, icons |
| `--bca-accent` | Butterfly yellow `#f5ba00` | Primary buttons, highlights, the announcement bar, focus ring on dark |
| `--bca-background` / `--color-page` | `#FCFCFC` | The page background everywhere, public site and admin (the grey-white of the BCA logo artwork) |
| `--bca-ink` / `--color-text` / `--color-muted` | Mid gray `#5f5f5f` | Body copy and secondary text; the second line of the homepage headline |
| `--bca-label` / `--color-label` | Deep yellow `#8a6800` | Small uppercase labels (eyebrows). The palette's `#B88A00` fails AA as small text (3.1 to 1 on the page, 2.8 on light gray); `#8A6800` keeps the hue and passes |
| `--color-tint` | Light gray `#f2f2f0` | Panels, hover fills, chips, the active menu item |
| `--color-tint-deep` | page mixed 12% with `#4b4b4d` (about `#e7e7e7`) | Panels behind portrait photographs |
| `--color-surface` | White `#ffffff` | Cards, forms, menus, dialogs, the help panel |
| `--color-border` / `--color-line` | `#e4e4e7` | Borders and dividers, public and admin |
| `--color-mist` | page mixed 3% with `#4b4b4d` (about `#f7f7f7`) | Table headers and quiet fills in the admin |
| `--color-accent-soft` | yellow mixed 22% with white | The pale end of the yellow hover edge on pathway cards |
| `--color-danger` / `--color-success` | `#b3261e` / `#1c6b3f` | Form errors and confirmations |
| WhatsApp button | `#0f7a5f` | Darker than WhatsApp green so the white icon reaches 5.29 to 1 |

Shadows are charcoal at low opacity. The `navy` and `primary` names are kept in the code and in saved settings and page content (renaming them would change stored values); they now hold charcoal. Admin > Settings > Colours and typography labels them by role.

### Contrast (WCAG 2.2 AA)

| Pair | Ratio | Result |
|---|---|---|
| Charcoal text on butterfly yellow (primary button, announcement bar) | 8.03 to 1 | Pass |
| White on charcoal (pathway panel, featured story, footer, admin sidebar) | 14.16 to 1 | Pass |
| Charcoal headings and links on the page background | 13.80 to 1 | Pass |
| Charcoal on light gray panels | 12.63 to 1 | Pass |
| Mid gray body text on the page / white / light gray | 6.22 / 6.39 / 5.70 to 1 | Pass |
| Deep yellow labels `#8A6800` on the page / white / light gray | 5.04 / 5.17 / 4.61 to 1 | Pass |
| Butterfly yellow on charcoal (quote marks, eyebrows on dark) | 8.03 to 1 | Pass |
| Form field border on the page (non-text, needs 3 to 1) | 3.2 to 1 or more | Pass |

Decorative dividers (`--color-line` on the page background, 1.24 to 1) are not the only way to identify any control, so they are exempt from the 3 to 1 non-text rule.

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
| `--section-space` | `clamp(1.75rem, 1.25rem + 2.2vw, 3.25rem)` vertical padding per section, so sections sit about 57px apart on phones and 105px on desktop (halved in October 2026: the earlier 224px gaps on desktop felt empty) |
| `container-site` | 75rem (1200px) maximum, close to iPEC's 1164px |
| `container-prose` | 44rem for long-form text |
| `--header-height` | 4.25rem on phones, 4.75rem from 1024px |

**Shape rule (one rule, applied everywhere):**

- Buttons are pills.
- Cards and images use `--radius-card` (1.25rem).
- Form fields use `--radius-field` (0.75rem).
- Feature images take one large "wing" corner (`--radius-wing`, 7.5rem) on wide screens. This is BCA's signature shape, echoing a butterfly wing.

**Brand accent:** on the homepage hero, soft butterfly wings in accent yellow behind an arched photograph, with one fine dotted orbit line. They sit behind the photo, never over faces, and scale with it. Elsewhere a solid sun-yellow disc sits behind the founder photograph. The only gradient in the system is the pale-to-warm yellow edge that appears on a "Choose your path" card on hover or keyboard focus. No glass effects.

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
- **On light backgrounds** (header, admin sign-in): the same artwork with the white lettering and antennae in mid gray `#5F5F5F` (6.2 to 1 on the page background). The owner chose mid gray over navy in October 2026; the butterfly is untouched.
- **Mark only**: the butterfly, extracted from the official SVG. `bca-mark-mid-gray.svg` (mid gray antennae) for light backgrounds such as the phone menu; `bca-mark-on-dark.svg` (white antennae) for the call to action, the stories panel and the admin.
- **Favicon and home-screen icon**: the yellow butterfly on a mid gray `#5F5F5F` rounded square (navy before October 2026).

The logo files are produced by `npm run images:optimise` from the official SVG. Nothing was redrawn. Browsers keep files under `/images` for a year, so a recoloured logo gets a new filename (`bca-logo-mid-gray.svg` replaced `bca-logo-on-light.svg`); the old addresses redirect to the new ones.

## 7a. The Level 1 ACC page

The ACC page's redesigned journey and "coaching wings" sections introduced the gray and yellow palette in October 2026; it now applies to the whole site (section 2). The journey is shared with the PCC and MCC pages, each with its own heading and phase names. The Certify card is solid butterfly yellow with charcoal text (8.0 to 1); the hours bar uses charcoal for coach education, gray for mentor coaching and yellow for coaching experience.

## 8. Image direction

One consistent look across all generated photography: documentary, editorial, natural window light, pale blue and soft white interiors with a single warm yellow accent, Indian professionals in contemporary workwear, candid rather than posed. See [IMAGE_ASSETS.md](IMAGE_ASSETS.md) and [HIGGSFIELD_IMAGE_PROMPTS.md](HIGGSFIELD_IMAGE_PROMPTS.md).

## 9. What was deliberately not taken from iPEC

iPEC was a reference for quality, clarity and structure, not a template. Nothing was copied from it: no logo, artwork, photography, code or copy. BCA's layout, type choices, shape language, imagery and wording are original.
