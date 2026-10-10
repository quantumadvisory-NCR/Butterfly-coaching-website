# Implementation checklist

Status of every requirement in the brief. Last updated 10 October 2026.

Key: **Done** = built and verified. **Done, unverified** = built, but could not be exercised without external accounts. **Owner** = needs a decision or input from the business.

## Phase 1: Research

| Item | Status | Where |
|---|---|---|
| Inspect every BCA page; record verified facts | Done | [RESEARCH.md](RESEARCH.md) |
| Record unresolved claims and inconsistencies | Done | RESEARCH.md section 2 |
| Inspect iPEC structure, navigation, trust and conversion patterns | Done | RESEARCH.md section 4 |
| Read iPEC's real colours from computed styles and stylesheets | Done | [BRAND_SYSTEM.md](BRAND_SYSTEM.md) section 1 |
| Map legacy URLs and plan redirects | Done | RESEARCH.md section 3 |

## Phase 2: Visual strategy

| Item | Status | Where |
|---|---|---|
| Design tokens: colour, type, spacing, containers, borders, radii | Done | `src/app/globals.css` |
| Palette documented, verified values separated from estimates | Done | BRAND_SYSTEM.md |
| Contrast calculated for every text pairing | Done | BRAND_SYSTEM.md section 2 |
| BCA logo and butterfly identity preserved | Done | Official SVG; navy-wordmark variant needs approval (Owner) |
| Mobile-first, fluid type and spacing (`clamp`, Grid, Flexbox) | Done | globals.css, all components |

## Phase 3: Image assets

| Item | Status | Where |
|---|---|---|
| Collect authentic BCA assets (logo, founder, faculty, students, events, ICF marks) | Done | 34 assets |
| Generate custom imagery with Higgsfield | Done | 24 images, 48 credits |
| Stock photography | Not needed | None used |
| Optimised masters, descriptive filenames, focal points | Done | `npm run images:optimise` |
| Desktop and mobile crops for the hero | Done | Art-directed `<picture>` |
| Asset manifest with source, licence, usage, alt text, type | Done | [IMAGE_ASSETS.md](IMAGE_ASSETS.md), generated from `seed/media.ts` |
| Prompt record | Done | [HIGGSFIELD_IMAGE_PROMPTS.md](HIGGSFIELD_IMAGE_PROMPTS.md) |
| No AI image presented as a real person | Done | Enforced by a unit test |
| Rights and consent confirmation | Owner | IMAGE_ASSETS.md "Before launch" |

## Phase 4: Application foundation

| Item | Status |
|---|---|
| Next.js 16 App Router, TypeScript (strict), React 19, Tailwind 4 | Done |
| Accessible primitives (Radix), one icon family (Phosphor) | Done |
| Security headers and Content Security Policy | Done |
| Local development mode with no external accounts | Done |

## Phase 5: Backend and CMS

| Item | Status | Notes |
|---|---|---|
| Migrations for all 14 required table groups (27 tables) | Done | `supabase/migrations/` |
| Unique slugs, indexes, foreign keys, timestamps, check constraints | Done | |
| JSONB section data validated by a defined schema | Done | `lib/blocks/registry.ts` |
| Row level security on every table, deny by default | Done | Tested |
| Protected admin routes, server-side authorisation on every action | Done | Tested |
| Roles: owner, administrator, editor | Done | Tested |
| Secure first-admin setup (token, zero-accounts only) | Done | Tested |
| Rate limiting on sign-in, setup, forms, uploads | Done | Tested |
| Audit log | Done | Tested |
| Safe uploads (type sniffing, re-encoding, EXIF removal, size limit) | Done | Tested |
| **Page builder**: create, edit, duplicate, archive, delete | Done | Tested |
| Add, edit, remove, reorder, hide and duplicate sections | Done | |
| 19 block types, including all 15 the brief lists | Done | Unit test checks the list |
| Structured forms, never raw JSON | Done | |
| Drafts, preview, publish, unpublish | Done | Tested |
| Preview at phone, tablet and desktop sizes | Done | Tested |
| SEO fields per page | Done | |
| Revision history and restore | Done | Pages. Tested |
| **Programmes**: every field the brief lists | Done | Changes flow to pages and cards. Tested |
| **Testimonials**: approval workflow | Done | Tested |
| **Blog**: editor, categories, tags, images, drafts, SEO | Done | |
| **Media library**: upload, replace, alt, caption, crop preview, usage, safe delete | Done | Tested |
| **Settings**: logo, favicon, contact, social, header, footer, newsletter, booking, map, colours, type, analytics | Done | Tested |
| **Navigation** with dropdowns; **Redirects** | Done | |
| **Users** management | Done | Tested |
| Responsive admin: drawer, single-column forms, stacked tables, fitted dialogs | Done | Tested at 390, 768 and 1366 |
| Supabase Auth adapter | Done, unverified | Needs a Supabase project |
| Supabase Storage adapter | Done, unverified | Needs a Supabase project |

## Phase 6: Public website

| Route | Status |
|---|---|
| `/` Home, with the mandatory hero copy and all ten sections | Done |
| `/coaching-certifications/` | Done |
| `/level-1-acc-coach-program/`, `/level-2-pcc-coach-program/`, `/level-3-mcc-program/` | Done |
| `/services/mentor-coaching-supervision/` | Done |
| `/services/coaching-services/` | Done |
| `/services/corporate-programs/` | Done |
| `/about-us/` | Done |
| `/testimonial/` | Done |
| `/blog/` with search, categories, tags, article pages | Done |
| `/contact-us/` | Done |
| `/privacy-policy/`, `/terms-of-use/` | Done; legal review needed (Owner) |
| `/thank-you/` | Done |
| Custom 404 | Done |
| `/image-gallery/` (preserved legacy page, with videos) | Done |
| Legacy URLs preserved or redirected | Done. Tested |
| Additional pages can be created in the CMS | Done. Tested |

## Phase 7: Functional integrations

| Item | Status | Notes |
|---|---|---|
| General, programme, corporate, mentoring, coaching and discovery-call forms | Done | Tested |
| Enquiries validated, stored, with source page and campaign data | Done | Tested |
| Lead inbox: statuses, notes, filters, search, CSV export (role-restricted) | Done | Tested |
| Spam prevention: honeypot, signed timing token, rate limit | Done | Tested |
| Newsletter signup | Done | Tested |
| WhatsApp, click-to-call, email links from verified defaults | Done | Tested |
| Booking integration | Done | Link-based; falls back to the discovery-call form. Booking URL needed (Owner) |
| Map | Done | Optional embed, loaded on click. Embed link needed (Owner) |
| Resource downloads | Done | Block and admin ready; no genuine downloads exist yet (Owner) |
| Conversion tracking for forms, WhatsApp, phone, CTAs, downloads | Done | Fires only with an ID configured and consent given |
| Consent banner | Done | |
| Notification email (Resend) | Done, unverified | Needs an API key |
| Analytics delivery | Done, unverified | Needs an analytics ID |

## Phase 8 and 9: Responsive refinement and QA

See [RESPONSIVE_QA_REPORT.md](RESPONSIVE_QA_REPORT.md) for the measured results.

| Item | Status |
|---|---|
| 18 pages at 11 viewports, automated checks plus full-page screenshots | Done. 209 tests passing |
| Admin at phone, tablet and desktop | Done. 9 screens at 3 sizes passing |
| Keyboard, focus, zoom, reduced motion, scroll fade-in | Done. Tested |
| axe-core accessibility scan | Done. No WCAG A or AA violations on 9 pages at 2 sizes |
| Type check, lint, unit tests, production build | Done. Clean; 59 of 59 unit and database tests passing |
| Whole end-to-end suite | Done. 269 of 269 passing |
| Lighthouse | Done, measured locally. Mobile performance 84 to 96; all other scores 97 to 100. Re-measure on the live address |
| Real phones and tablets, Safari, Firefox, screen reader | Not done. See section 12 of the report |

## Phase 10: Handover

| Document | Status |
|---|---|
| `README.md`, `.env.example` | Done |
| Migrations and seed instructions | Done (README, DEPLOYMENT.md) |
| Admin setup guide | Done |
| CMS user guide | Done |
| Deployment guide | Done |
| Brand system | Done |
| Image assets | Done |
| Higgsfield prompts | Done |
| Content approval checklist | Done |
| Launch checklist | Done |
| Responsive QA report | Done |
| Architecture and research records | Done |

## Deliberate decisions and departures

| Decision | Reason |
|---|---|
| React Hook Form not used | Forms use server actions with `useActionState`, which need no client form library. The brief lists it as "where appropriate" |
| shadcn/ui not installed as a package | The same approach is used directly: Radix primitives styled with the project's own tokens |
| Dark mode not built | The brief specifies a light, iPEC-derived palette with admin-editable tokens |
| Booking is a link, not an embedded widget | Works with any provider and needs no third-party script |
| No email-based password reset | Owner-led resets are simpler and safer for a small team; documented in ADMIN_SETUP.md |
| One article held as a draft | It makes outcome claims that could not be verified |
| Level 3 accreditation held back until confirmed | The existing site contradicts itself. The owner confirmed it on 10 October 2026, and the badge and wording are now shown |
| Revision restore for pages only | Programmes and articles save directly; the audit log records each change |

## Outstanding

1. Owner approvals in [CONTENT_APPROVAL_CHECKLIST.md](CONTENT_APPROVAL_CHECKLIST.md).
2. Supabase project, then the verification steps in [DEPLOYMENT.md](DEPLOYMENT.md) step 6.
3. Optional services: Resend, booking link, analytics.
4. Checks on real devices and the live network.
