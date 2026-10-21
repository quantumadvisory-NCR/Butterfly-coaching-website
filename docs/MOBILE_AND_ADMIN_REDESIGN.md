# Mobile redesign and admin dashboard (October 2026)

What changed in the October 2026 mobile and admin round, why, and how it was checked. The approved desktop website (1024 px and wider) was not to change at all; every public-site change below is scoped to narrower screens.

## 1. Colour audit

The palette was read from the code and then checked against the computed styles of the live site (`https://butterfly-coaching-website.vercel.app/`, homepage at 1440 px, read-only) on 20 October 2026. Every value matched; no colour was taken from the logo image alone, and no new colour was introduced.

Source priority: the tokens in [`src/app/globals.css`](../src/app/globals.css) (`:root` and `@theme inline`), overridable from **Admin > Settings > Colours** through `DEFAULT_THEME` in [`src/lib/settings.ts`](../src/lib/settings.ts) and injected by [`src/app/layout.tsx`](../src/app/layout.tsx). The live theme settings hold the same five values as the code defaults.

| Role | Hex (verified live) | Defined in |
|---|---|---|
| Main page background | `#FCFCFC` | `--bca-background` (globals.css, settings `theme.background`) |
| Alternate sections, quiet panels | `#F1F1F2` (tint), `#E7E7E7` (tint-deep), `#F7F7F7` (mist) | `--color-tint`, `--color-tint-deep`, `--color-mist`: the page colour mixed 6%, 12% and 3% with the logo grey `#4B4B4D` |
| Primary text (headings) | `#0F256A` | `--bca-navy` |
| Body text | `#444746` | `--bca-ink` |
| Secondary text | `#5B5F5D` | `--color-muted` |
| Accent yellow | `#F5BA00` | `--bca-accent` |
| Pale yellow | `#FCF0C7` | `--color-accent-soft` (accent 22% with white) |
| Primary button | `#F5BA00` background, `#0F256A` text | `.btn-primary` (globals.css) |
| Primary button hover | `#0F256A` background, white text (white background, navy text on dark sections) | `.btn-primary:hover`, `.on-dark .btn-primary:hover` |
| Secondary button | transparent, `#0F256A` 2px border and text; on dark sections white 70% border, white text | `.btn-secondary`, `.on-dark .btn-secondary` |
| Links, second headline line, proof icons | `#0068BF` | `--bca-primary` |
| Borders and dividers | `#E4E4E7` | `--color-line` / `--color-border` |
| Form field border | `#8A8F8D` | `.field-input` |
| Card background | `#FFFFFF` | `--color-surface` |
| Announcement bar | `#F5BA00` background, `#0F256A` text | `AnnouncementBar` (site-header.tsx) |
| Header | page colour at 85% with blur; bottom border `#E4E4E7` at 80% | `SiteHeader` |
| Focus ring | 3px `#0F256A`; `#F5BA00` on dark sections | `:focus-visible`, `.on-dark :focus-visible` |
| Dark sections ("Choose your path", stories, closing call to action, footer) | `#0F256A` | `bg-navy` |
| Footer dividers | white at 10% | `border-white/10` |
| Card hover edge (gradient) | `#FFF6D6` → `#FCF0C7` → `#F5BA00` → `#FFD65C` | `.path-card::before`, `.lift-card::before` |
| WhatsApp button | `#0F7A5F` | support-dock.tsx (darker than WhatsApp green, so the white icon passes contrast) |
| Success, danger (forms, admin) | `#1C6B3F`, `#B3261E` | `--color-success`, `--color-danger` |

The mobile layouts and the admin dashboard use only these tokens.

## 2. The mobile hero: why the photograph sat so low, and the fix

Measured on the production build before the change (top of the photograph, in pixels from the top of the page):

| Screen | Photograph started at | First screen ends at |
|---|---|---|
| 320 x 700 | 937 | 700 |
| 360 x 800 | 924 | 800 |
| 375 x 812 | 887 | 812 |
| 390 x 844 | 888 | 844 |
| 430 x 932 | 868 | 932 |

Cause: below 1024 px the hero is a single column, and the whole text column came first: the eyebrow, a three- or four-line headline, the supporting copy, two full-width buttons stacked (108 px), three rows of proof pills (124 px) and the avatar row, about 700 px in all. Only then came the photograph, itself inside an arch with space above it for the wing artwork.

Fix (a new composition, not a negative margin): on phones and tablets the photograph comes first, as a wide, rounded image straight under the header with the founder's credential card on its lower edge; then the eyebrow, headline, copy and both buttons; the three proof points become one compact strip of three with icons and thin dividers instead of three rows of pills. Below 360 px the photograph uses a slightly wider crop so the primary button still fits the first screen.

After: the photograph starts at 117 to 135 px on every phone, and both buttons are on the first screen at 360 x 800 and larger (the primary button at 320 x 700 too).

## 3. Mobile sections (below 1024 px)

| Section | On phones and tablets |
|---|---|
| Announcement bar | Tighter (54 px instead of 60 px on phones); content and link unchanged |
| Header and menu | The menu opens full screen on phones with the butterfly mark and yellow section rules; it already locked the page behind it, trapped focus, closed on Escape and after navigating, and kept "Book a discovery call", Call and WhatsApp pinned at the bottom |
| Hero | See section 2 |
| Proof points | One strip of three, icons above short labels |
| Choose your path | One path per row, the icon beside the title, line and link; all three in view (the earlier sideways swipe row is removed) |
| Statistics | Unchanged 2 x 2 grid |
| Accreditation | Unchanged tiles |
| Why learners choose BCA | An editorial sequence: numbered yellow tiles on a thin connecting line with the text beside them, instead of three boxed cards; wider photograph crop |
| Explore programmes | One pathway per row with every fact in view; facts side by side under a rule; the service cards show a thumbnail beside the text |
| Learning journey | Unchanged vertical sequence |
| Founder | A compact portrait with the eyebrow, name and credentials beside it, then the biography, the three facts side by side and the button |
| Student stories | Unchanged featured story and selector |
| FAQ | Heading, then the questions, then the "Still unsure?" help card (it came before the questions) |
| Closing call to action, newsletter | Unchanged |
| Footer | The brand and contact details full width, the Programmes and Academy lists side by side |
| WhatsApp and Need help | Stay out of the way until the visitor has scrolled past most of the first screen; on phones "Need help?" is a round button the size of the WhatsApp one, stacked beneath it; the footer leaves room so no footer link is covered |

No content, link, figure, testimonial or claim was added or changed.

## 4. Admin dashboard

All figures come from the database in one query (`contentCounts` in [`src/lib/admin/entity-store.ts`](../src/lib/admin/entity-store.ts)); recent activity comes from the existing audit log (`recentActivity`). Nothing is a placeholder.

- **Welcome panel**: the greeting and today's date (India time), "Welcome, name", one sentence on what is waiting (built from the counts), and buttons to view the website and to review new enquiries or edit pages.
- **Six figures**, each a link: new enquiries (with open and this-week counts), published pages (with unpublished changes or drafts), published programmes, published articles, approved testimonials (with any awaiting approval), newsletter subscribers (with the last 30 days). Cards needing action get the yellow edge.
- **Quick actions**: edit pages, create a page, add a new course, write an article, review enquiries, manage testimonials, media library, and for admins the announcement bar and settings. Every one is an existing route; items an editor cannot open are not shown to editors.
- **Latest enquiries** with status badges.
- **Recent activity**: the last eight content changes (who, what, when), linked to the item where it still exists and the person may open it. Sign-ins, account changes and exports are left out; they stay in the owner-only audit log.
- **Needs your attention**: only items with a real count above zero (new enquiries, testimonials to approve, pages with unpublished changes, images missing alt text) and setup gaps (announcement bar hidden, no booking link, email or analytics not configured).

The existing navigation, list screens, editors, permissions and saving were kept. On phones the dashboard stacks (the quick actions become a two-column grid of tiles) and the Edit and View links on list screens become 44 px buttons.

## 4a. Follow-up, 21 October 2026

- **Logo**: on light backgrounds the wordmark and antennae are mid gray `#5F5F5F` instead of navy, on every page and the phone menu (desktop included, as asked). The browser-tab and home-screen icon is mid gray too. The files were renamed (`bca-logo-mid-gray.svg`, `bca-mark-mid-gray.svg`) because visitors' browsers had cached the navy files for a year; migration `0002_brand_logo_mid_gray.sql` points the media library at the new names.
- **Level 1 ACC page** (desktop, tablet and phone): redesigned from the owner's design refresh proposal. "The journey, step by step" becomes "From curious to credentialed": the total hours, milestones and credential as headline figures (162 = 77 + 10 + 75, added up from the steps' own hours), then Learn, Practise and Certify, each with its steps word for word; Certify in solid yellow. "What you will build" becomes "Your coaching wings": three core skills and three foundations either side of a slowly flapping butterfly, each with an icon, a number and the proposal's one-line description. The page uses the proposal's palette (see BRAND_SYSTEM.md, 7a). Step and outcome text still comes from the admin; if the number of steps or outcomes changes there, the page falls back to the plain list rather than mis-grouping them. Other programme pages are unchanged.
- **Phones and tablets**: "Need help?" is the same pill as on desktop; the closing "Ready to find your next step?" section is hidden; the footer drops the Contact column and the empty space at the bottom (the floating buttons step aside at the foot of the page instead).

## 5. Results (20 October 2026, local production builds)

**Desktop unchanged.** Eight public pages (home, student stories, Level 1, about, programmes, corporate, contact, blog) were captured full-page at 1024, 1280, 1366, 1440 and 1920 px from a clean build of the code before this round, and again after. 35 of the 40 captures are pixel-identical. The other five are the blog page, where every difference sits inside one photograph; that photograph also differed between two captures of the unchanged build (image-decoding noise), so the page is unchanged. A first attempt was invalid because the build reused a stale data cache from an earlier test run; both captures were redone with the cache cleared.

**Phones.** The hero photograph starts at 117 to 135 px (it was 868 to 937 px), and both buttons sit on the first screen at 320 x 700, 360 x 800, 375 x 812, 390 x 844 and 430 x 932. No horizontal scrolling at any of these sizes or at 768 and 820 px.

| Check | Result |
|---|---|
| TypeScript and ESLint | Clean |
| Unit tests | 72 passed |
| End-to-end tests (public pages at 320 to 1920 px, accessibility, forms, admin sign-in, editing, saving, publishing) | 269 passed |
| Public interaction checks (hero, path cards, figures, stories, FAQ, help panel, menu; phones 320 to 430 px) | All passed |
| Admin screens (every list and editor opens; no console errors, page errors or server errors) | All passed |
| Lighthouse, homepage, mobile (three runs) | Performance 90, 91, 91; LCP 3.5 s; Total Blocking Time 60 to 70 ms; CLS 0; accessibility, best practices and SEO 100 |
| Admin timings at ~2 ms database round trip (median of 3) | Dashboard 108 ms; lists 83 to 104 ms; editors 93 to 131 ms; saves 268 to 433 ms |

**Not covered:** the checks ran in Chromium with phone emulation, not on physical iPhones or Android phones, and not in Safari. The live admin with real enquiry data is checked after deployment.
