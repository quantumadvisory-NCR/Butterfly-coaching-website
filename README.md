# Butterfly Coaching Academy website

The public website, backend and content management system for [Butterfly Coaching Academy](https://butterflycoachingacademy.com/) (BCA), rebuilt from scratch.

- **Public site**: 12 CMS pages, three programme pages, a blog and a custom 404, designed for phone, tablet and desktop together.
- **Admin** at `/admin`: a page builder, programme management, blog, testimonials, FAQs, media library, enquiry inbox, navigation, redirects, settings, users and an audit log.
- **Backend**: PostgreSQL, with every piece of site content stored in the database.

## Run it now

No accounts or external services are needed.

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000. The first run starts an embedded PostgreSQL server, creates the tables and loads the launch content.

To use the admin, open http://localhost:3000/admin/ and create the owner account. The setup token is the `ADMIN_SETUP_TOKEN` value in `.env.local`. See [docs/ADMIN_SETUP.md](docs/ADMIN_SETUP.md).

If `.env.local` does not exist yet, copy `.env.example` to `.env.local`, keep `BCA_LOCAL_MODE=1`, and generate the two secrets as described in the file.

Stop the server with Ctrl+C so the local database shuts down cleanly. If it was closed abruptly instead, the next start waits a few seconds and clears what was left behind by itself.

## What is and is not connected

| | Status |
|---|---|
| Public website, admin, database, forms, lead inbox | Built and tested end to end |
| Local development mode (embedded database, local sign-in, disk uploads) | Working |
| **Supabase** (production database, sign-in, storage) | Code complete. **Not yet run against a live project**: no credentials were available. Follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), which includes the checks to confirm it |
| **Enquiry notification email** (Resend) | Code complete, not configured. Enquiries are saved to the inbox regardless |
| **Booking link**, **analytics**, **social links** | Empty settings, ready for the owner to fill in |

## Documentation

| Read this | When you want to |
|---|---|
| [docs/CMS_GUIDE.md](docs/CMS_GUIDE.md) | Edit the website day to day |
| [docs/ADMIN_SETUP.md](docs/ADMIN_SETUP.md) | Create the first administrator and manage the team |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Put the site live on Supabase and Vercel |
| [docs/CONTENT_APPROVAL_CHECKLIST.md](docs/CONTENT_APPROVAL_CHECKLIST.md) | See what the owner must confirm before launch |
| [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md) | Go live safely |
| [docs/RESPONSIVE_QA_REPORT.md](docs/RESPONSIVE_QA_REPORT.md) | See what was tested, at which screen sizes, and the results |
| [docs/BRAND_SYSTEM.md](docs/BRAND_SYSTEM.md) | Understand the palette, type and design tokens |
| [docs/IMAGE_ASSETS.md](docs/IMAGE_ASSETS.md) | Check the source and licence of every image |
| [docs/HIGGSFIELD_IMAGE_PROMPTS.md](docs/HIGGSFIELD_IMAGE_PROMPTS.md) | Regenerate or extend the custom photography |
| [docs/RESEARCH.md](docs/RESEARCH.md) | See the verified facts and unresolved claims from the old site |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Change the code |
| [docs/IMPLEMENTATION_CHECKLIST.md](docs/IMPLEMENTATION_CHECKLIST.md) | Track what was built against the brief |

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server, with the local database started for you |
| `npm run local:build` | Production build against the local database |
| `npm run local:start` | Serve that production build |
| `npm run build` / `npm run start` | Build and serve against the database in `DATABASE_URL` (production) |
| `npm run db:migrate` | Apply SQL migrations |
| `npm run db:seed` | Load or refresh the launch content (safe to re-run) |
| `npm run db:reset` | Wipe all content, then seed. **Never on a live site** |
| `npm run content:upgrade-home` | Show how the homepage would change to the October 2026 layout; add `-- --apply` to save it as a draft (never publishes). See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| `npm run db:generate` | Create a migration from changes to `src/lib/db/schema.ts` |
| `npm run db:start` | Keep the local database running on its own |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Unit and database tests (Vitest) |
| `npm run test:e2e` | End-to-end and responsive tests (Playwright) on a production build |
| `npm run check` | Type check, lint and unit tests together |
| `npm run images:optimise` | Rebuild `public/images` from the source images in `.local/raw` |
| `npm run docs:images` | Regenerate `docs/IMAGE_ASSETS.md` from the media manifest |
| `npm run lighthouse` | Lighthouse scores for five representative pages on a running site (needs Google Chrome) |

`npm run test:e2e` builds the site, runs it on port 3100 against a separate `bca_e2e` database, and saves full-page screenshots of every page at every tested screen size to `test-results/screens/`.

## Seed and migration instructions

- **Migrations** live in `supabase/migrations/` as plain SQL. `npm run db:migrate` applies any that have not run yet, on Supabase or locally. They can also be pasted into the Supabase SQL editor in filename order.
- **Seed content** lives in `seed/content.ts` (pages, programmes, testimonials, FAQs, navigation, redirects), `seed/media.ts` (the image register) and `seed/data/posts.json` (the imported blog). `npm run db:seed` loads it. Seeded records have stable ids, so running it again updates them in place and never duplicates. Users, enquiries and subscribers are never touched.
- In local mode both happen automatically the first time the database is empty.

## Project layout

```
src/app/            routes: (site) public pages, admin, API
src/components/     blocks, site, admin and shared UI
src/lib/            blocks, admin stores, auth, content, db
supabase/migrations SQL migrations
seed/               launch content and media manifest
scripts/            database, seed, image and docs tooling
tests/              unit (Vitest) and end-to-end (Playwright)
docs/               all guides
public/images/      optimised image masters
```

More detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Requirements

Node.js 22 or later. Tested on Node.js 24 with npm 11 on Windows 11.
