# Architecture

How the application is put together and why. Read this before changing anything structural.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript, Turbopack) |
| Styling | Tailwind CSS 4, design tokens in `src/app/globals.css` |
| UI primitives | Radix UI (dialog, accordion, navigation menu, tabs, alert dialog), Phosphor icons |
| Database | PostgreSQL: Supabase in production, an embedded server for local development |
| Data access | Drizzle ORM over the `postgres` driver, server only |
| Auth | Supabase Auth in production; a built-in scrypt and signed-cookie adapter for local development |
| Storage | Supabase Storage in production; local disk in development |
| Validation | Zod 4 |
| Rich text | Tiptap 3 in the admin, `sanitize-html` on the server |
| Email | Resend (HTTP API), optional |
| Tests | Vitest (unit and database), Playwright with axe-core (end to end) |

## Directory map

```
src/app/
  layout.tsx              html, fonts, theme tokens from settings
  (site)/                 public website: header, footer, analytics
    [[...slug]]/page.tsx  every CMS page, programme page and blog post
    blog/                 blog index, category, tag, legacy pagination
    preview/page/[id]/    draft preview (staff only)
  admin/
    login/, setup/        sign-in and first-run setup
    (panel)/              the admin, behind requireUser()
    actions/              server actions (auth, content, operations)
    preview/[id]/         device-frame preview
  api/admin/media/        upload endpoint
  media/[...key]/         serves local uploads in development
src/components/
  blocks/                 one renderer per page-builder block
  site/                   header, footer, forms, templates
  admin/                  admin screens and the form engine
  ui/                     shared primitives
src/lib/
  blocks/                 field DSL and block registry
  admin/                  entity definitions and stores
  auth/                   auth adapters and role checks
  content/public.ts       cached read model for the public site
  db/                     Drizzle schema and client
supabase/migrations/      SQL migrations
seed/                     launch content and media manifest
scripts/                  database, seed, image and docs tooling
tests/                    unit and end-to-end tests
```

## Key decisions

### 1. One field declaration drives the type, the validator and the form

`src/lib/blocks/fields.ts` defines a small field DSL. Every page-builder block (`registry.ts`), every admin content type (`lib/admin/entities.ts`) and every settings group (`lib/settings.ts`) is a list of fields. From that single declaration the code derives:

- the **TypeScript type** (`DataOf<typeof fields>`),
- the **Zod schema** used on the server (`objectSchema`),
- the **editing form** (`components/admin/field-renderer.tsx`).

Adding a field to a block is a one-line change, and the form, the validation and the types cannot drift apart. This is what makes "structured forms, never raw JSON" practical across nineteen blocks.

To add a block: declare its fields in `registry.ts`, write a renderer in `components/blocks/`, register it in `components/blocks/index.tsx`.

### 2. Draft and published content are physically separate

- `pages` and `page_sections` hold the **working copy**.
- Publishing freezes the working copy into a `revisions` row; `pages.published_revision_id` points at it.
- The public site reads **only** that snapshot (`getPublishedPage`).

So a draft can never leak: the public read path has no access to the working copy. Saving an edit to a live page changes nothing publicly until Publish. Every publish is a revision, which gives version history and restore for free.

Programmes, articles and other content types are simpler: a `status` column, and the public queries filter on `published` or `approved`.

### 3. One catch-all route

`src/app/(site)/[[...slug]]/page.tsx` resolves a path in this order: redirect, CMS page, programme, article. This is why:

- the owner can create a page at any address,
- legacy WordPress article addresses (`/article-slug/`) keep working,
- a CMS page at a programme's address replaces the built-in programme template.

Pages render on first request and are then cached (ISR, one hour). `generateStaticParams` returns an empty list on purpose, so a build does not need the database.

### 4. Caching: one tag, cleared on every change

Every public read is wrapped in `unstable_cache` under a single tag (`content`). Every admin mutation calls `revalidateContent()`, which clears that tag and the page cache. On a site this size, one broad invalidation is simpler and safer than tracking which page uses which record, and it guarantees "save, then it is live".

Consequence: changing the database **directly** (for example re-running the seed against production) does not clear the cache. Save anything in the admin, or redeploy, to refresh it.

### 5. All data access is server-side; RLS is deny-by-default

The browser never talks to the database. Server components and server actions connect with the role in `DATABASE_URL`, and authorisation is enforced in code:

- `requireUser(role)` in every admin page and layout,
- `assertUser(role)` inside every server action and route handler (through `guarded()`).

Row level security is enabled on **every** table with **no policies**, and privileges are revoked from Supabase's `anon` and `authenticated` roles. The auto-generated Supabase Data API therefore exposes nothing, even though the anon key is public. A test fails if any table lacks RLS.

Roles: `editor` (content, media, enquiry inbox), `admin` (plus settings, navigation, redirects, exports, deletions), `owner` (plus users and the audit log).

### 6. Local development mode

Supabase's local stack needs Docker. To let anyone run and test the whole application, including the admin, without accounts or Docker, `BCA_LOCAL_MODE=1` swaps three adapters:

| Concern | Production | Local mode |
|---|---|---|
| Database | Supabase Postgres | Embedded PostgreSQL 18 in `.local/pg` (`scripts/with-db.ts`) |
| Auth | Supabase Auth | scrypt hashes in `local_credentials`, signed http-only cookie (`lib/auth/local.ts`) |
| Storage | Supabase Storage | `.local/uploads`, served by `/media/...` |

The SQL, the queries and every screen are identical in both modes; only these three thin adapters differ. Local mode is opt-in and is ignored as soon as the Supabase variables are set. It is for development and testing, not for hosting the live site.

**What this means for confidence:** the database schema, every query, the CMS and all forms are exercised by the automated tests against real PostgreSQL. The Supabase Auth and Supabase Storage adapters (`lib/auth/supabase.ts`, the Supabase branch of `lib/storage.ts`) follow Supabase's documented patterns but **have not been run against a live Supabase project**, because no credentials were available. [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) lists the checks to do once they are.

### 7. Images

- Masters live in `public/images` (seeded) or storage (uploaded). `next/image` serves AVIF or WebP at the size each screen needs.
- Every image has a **focal point**; crops use it as `object-position`.
- The hero uses real art direction: a `<picture>` with a wide crop for stacked layouts and a tall crop for the split layout, so each device downloads only its own.
- Uploads are decoded and re-encoded with sharp. That strips EXIF data (including location), rejects anything that is not really an image, and caps the size. SVG uploads are refused.
- Images are referenced by media **id**, never by URL, so replacing a file updates every use.

### 8. Forms and spam

Enquiries go through a server action: Zod validation, a honeypot field, a signed time-based token (issued when the visitor starts typing; rejects instant and stale submissions), and a Postgres-backed rate limit of five per fifteen minutes per visitor. IP addresses are hashed before they are used as a rate-limit key and are never stored raw. The enquiry is saved first; the notification email is best-effort and its outcome is recorded honestly on the enquiry.

The form components run in the browser, so they import labels and option lists from `src/lib/validation/form-constants.ts`, which has no dependencies. The Zod schemas stay in `src/lib/validation/forms.ts` and are only ever loaded on the server. Keep it that way: importing `forms.ts` or `src/lib/db/schema.ts` from a public client component ships the validation library and the database schema to every visitor.

### 9. Analytics and consent

No third-party script loads by default. When an analytics ID is added in Settings, a consent banner appears and nothing loads until the visitor accepts. Conversion events (form submit, WhatsApp, phone, CTA, download) are sent by one delegated listener that reads `data-track` attributes, so new buttons are tracked automatically.

## Security summary

| Control | Where |
|---|---|
| Server-side authorisation on every admin page and action | `lib/auth`, `lib/admin/action-helpers.ts` |
| First-admin setup needs a secret token and only works with zero accounts | `admin/actions/auth.ts` |
| Rate limiting: sign-in, setup, enquiries, newsletter, uploads | `lib/security.ts` |
| Rich text sanitised on the server before storage | `lib/sanitise.ts` |
| Links restricted to safe schemes (no `javascript:` or `data:`) | `lib/blocks/fields.ts` |
| Upload type sniffing, re-encoding, size limit | `lib/admin/media-store.ts` |
| CSV exports guarded against formula injection | `lib/admin/csv.ts` |
| Security headers: CSP, HSTS, nosniff, frame options, referrer and permissions policy | `next.config.ts` |
| RLS deny-by-default on every table | `supabase/migrations/0001_security.sql` |
| Audit log of sign-ins and every change | `lib/audit.ts`, **Admin > Audit log** |
| Secrets only in server environment variables | `.env.example` |

Known trade-off: the CSP allows inline scripts, because cached pages need Next.js's inline bootstrap scripts. Moving to nonces would make every page dynamic and slower. All other sources are an explicit allow-list.

## Changing the database

1. Edit `src/lib/db/schema.ts`.
2. `npm run db:generate` writes a new SQL file to `supabase/migrations/`.
3. If you added a table, add `alter table public.<name> enable row level security;` to that file.
4. `npm run db:migrate` applies it. `npm test` checks that RLS is on everywhere and that the schema matches.
