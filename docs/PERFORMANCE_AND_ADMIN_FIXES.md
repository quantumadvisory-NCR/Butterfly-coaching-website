# Admin performance and the broken Edit buttons (October 2026)

What was wrong with the admin on the live site, how it was proven, what was changed, and what was measured. Written on 19 October 2026.

## Symptoms

- Clicking **Edit** on a testimonial, programme, page or any other record appeared to do nothing.
- Every admin screen felt slow.

## What was found

### 1. The Edit buttons: database queries that never returned (root cause)

Reproduced on the live site with the owner signed in (read-only: editors were opened, nothing was saved):

- Clicking **Edit** on a testimonial sent the request for the editor, then nothing changed on screen. The browser later fell back to a full page load, which also never completed.
- Vercel's logs for those requests: `Vercel Runtime Timeout Error: Task timed out after 300 seconds` (testimonial editors), and for the programme editor `canceling statement due to statement timeout`.
- The live database showed two sessions stuck for minutes in `active` / `ClientRead` on the programme editor's own queries (`programme_modules`, `cohorts`): Postgres was waiting for the rest of a query the application never sent.
- The audit log contained no saved change at all since launch: no edit had ever reached the database.

Cause, isolated with read-only test queries against the live connection pooler:

| Same twelve-query burst, three pooled connections | Result |
|---|---|
| Local PostgreSQL, no pooler, 200 ms round trip | Completes |
| Supabase **session** pooler (port 5432), 200 ms | Completes |
| Supabase **transaction** pooler (port 6543), the site's connection, 2 ms or 200 ms | **Hangs every time** |
| Transaction pooler, every query parameterised | Completes |
| Transaction pooler, queries run one after another | Completes |
| Transaction pooler, twelve parameterless queries at once | **Hangs** |
| Transaction pooler, pipelining switched off (`max_pipeline: 0`) | **Completes, 9 of 9 runs, including 39-query bursts** |

The database driver (postgres.js) *pipelines* parameterless queries: when every pooled connection is busy it sends further queries down a connection before the previous answer has arrived. Supabase's transaction-mode pooler (Supavisor) drops the pipelined ones, so the page waits until Vercel kills it after five minutes, and the killed function leaves the database session hanging too. An editor runs about a dozen queries at once (record, related rows, reference lists, media library, the menu badge, the user check), more than the three connections the site used on Vercel, so it always pipelined. List screens run two or three, which is why they worked. It never happened locally because local development connects to PostgreSQL directly, without the pooler.

**Fix:** `src/lib/db/index.ts` sets `max_pipeline: 0` (never send a query on a busy connection) and raises the Vercel pool from 3 to 6 connections. A unit test (`tests/unit/db.test.ts`) fails if pipelining is ever switched back on.

### 2. Slowness: the server ran on the other side of the world from the database

- Supabase project: Mumbai (`ap-south-1`). Vercel functions: Washington DC (`iad1`, Vercel's default). Response headers on the live site read `bom1::iad1`: requests enter Vercel in Mumbai, then travel to Washington.
- Every database query and every Supabase sign-in check therefore crossed the globe and back (about 200 ms), and with the transaction pooler each parameterised query takes two round trips. Opening an editor took 14 to 24 sequential round trips; saving a page about 35.

**Fix:** `vercel.json` pins the functions to Mumbai (`bom1`).

### 3. Slowness: a flood of background requests

Every visible link in the admin was prefetched in the background: 66 requests on opening the dashboard, a dozen on each list, and 25 more after every save (saving clears the router cache, so everything is prefetched again). Each one passed through the sign-in proxy, which asks Supabase Auth who the user is, and most also queried the database. They competed with the click the user actually made and filled the small connection pool, which made the hang in finding 1 even more likely.

**Fix:** `src/components/admin/admin-link.tsx`. Admin links no longer prefetch; instead the clicked link shows a spinner immediately (`useLinkStatus`), so a click never looks ignored. A loading skeleton was tried and removed: React holds a skeleton on screen for at least about 300 ms, which made fast navigations slower (measured: 344 ms with the skeleton against about 120 ms without).

### 4. Smaller inefficiencies

| Problem | Fix |
|---|---|
| Every save re-rendered the editor twice: once inside the server action (it revalidates) and again through `router.refresh()` | Client refreshes removed; actions that change only admin data call `refresh()` so the refreshed screen arrives in the same response |
| The record title for the editor header and the audit log came from loading the entire table, including every blog article's full HTML | `entityRow()` fetches one row; list queries select only the columns they show |
| The page editor loaded the page, then its sections, then everything else, one after another | All in parallel (`loadPage`, `pages/[id]/page.tsx`) |
| Checking whether a page address is free ran three lookups one after another | In parallel (`pathTakenBy`) |
| An editor address with a malformed id reached the database and failed with a server error | Returns "not found" |

## Measurements

Measured with a production build on this computer, in local development mode, with the database reached through a proxy that adds network delay, so both builds see exactly the same conditions. Times are measured inside the browser from click to usable screen (median of three runs). The "200 ms" rows imitate today's Washington-to-Mumbai set-up; the "2 ms" rows imitate functions in Mumbai next to the database. Local PostgreSQL has no pooler, so these numbers show speed only: the hang in finding 1 cannot occur locally, and on the live site the editors did not open at all.

| Step (median of 3, ms) | Before, 200 ms (today's set-up) | After (code only), 200 ms | After (code + Mumbai region), 2 ms |
|---|---|---|---|
| Sidebar: open Testimonials | 712 | 708 | **124** |
| Edit: open a testimonial | 962 | 936 | **111** |
| Save a testimonial | 1,609 | 1,830 | **280** |
| Sidebar: open Pages | 698 | 715 | **100** |
| Edit: open the About page builder | 1,805 | 925 | **114** |
| Save the About page as a draft | 3,955 | 3,112 | **410** |
| Sidebar: back to the Dashboard | 885 | 1,107 | **109** |

Reading the table:

- **On the live site the "before" editors never opened at all** (finding 1); the 962 ms and 1,805 ms above are what the old code achieves without the pooler. The fix for that is the difference between "hangs for five minutes" and "opens".
- **The region move is the big speed gain**: every step drops to roughly a tenth. For comparison, the original code with the database next door would have measured 96 to 502 ms on the same steps, so in-region the code changes are worth a further 20 to 60 per cent on the heavier screens (page builder 277 to 114 ms, page save 502 to 410 ms).
- Code changes alone, still in Washington, halve the page builder (1,805 to 925 ms) and cut a page save by 0.8 s. A testimonial save now reports "Saved" about 0.2 s later than before, because the refreshed screen arrives in the same response instead of in a second request afterwards; the total work is lower.
- A loading skeleton was measured and rejected: it held fast navigations on screen for about 300 ms (sidebar 344 ms with it, 124 ms without).

Background requests (prefetches) per screen: dashboard 66 before, 0 after; a list screen 7 to 17 before, 0 after; after a save 15 to 25 before, 0 after.

## Re-check after the visual refinements (19 October 2026)

The second round of design changes (the logo's grey-white background, the reworked accreditation strip, "Why learners choose BCA", the student stories page and the closing call to action) changes markup and CSS only: no new client-side JavaScript, no new database queries. Both were measured again on production builds against the same local data.

| Admin step (median of 3, ~2 ms database round trip, ms) | Before this round | After this round |
|---|---|---|
| Sidebar: open Testimonials | 124 | 121 |
| Edit: open a testimonial | 111 | 112 |
| Save a testimonial | 280 | 246 |
| Sidebar: open Pages | 100 | 113 |
| Edit: open the About page builder | 114 | 107 |
| Save the About page as a draft | 410 | 381 |
| Sidebar: back to the Dashboard | 109 | 112 |

| Public page, Lighthouse 13.5 mobile (simulated throttling) | `main` before this round | After this round |
|---|---|---|
| Homepage performance score, three runs | 89, 85, 90 | 87, 89, 87 |
| Homepage Largest Contentful Paint | 3.5 to 3.6 s | 3.6 to 3.9 s |
| Homepage Total Blocking Time | 90 to 190 ms | 90 to 110 ms |
| Student stories performance score | 90 | 92 |
| Accessibility, best practices, SEO (homepage and stories) | not re-measured | 100, 100, 100 |
| Cumulative Layout Shift | 0 | 0 |

Both columns are within the normal run-to-run spread. On a phone the Largest Contentful Paint element is the header logo in both builds; nearly all of its time is render delay under the simulated slow CPU, not network.

**20 October 2026 (announcement bar, swipe rows on phones and tablets, stacked WhatsApp and help buttons, new-course pages, editable account name):** admin medians at ~2 ms were 107, 116, 222, 108, 115, 415 and 114 ms for the seven steps above, the same as before. Homepage Lighthouse (mobile, three runs): performance 86, 87, 85; Largest Contentful Paint 3.6 to 3.7 s; Total Blocking Time 140 to 150 ms (about 40 ms more, from the small script that drives the swipe rows' dots); Cumulative Layout Shift 0; accessibility, best practices and SEO 100.

## The admin redesign round (27 November 2026)

The redesign (6df7240) brought back a `(panel)/loading.tsx` skeleton and added entrance animations. The owner reported the admin as slow. Measured on a local production build, from the click until the new screen's own heading is on screen (median of five, ms):

| Step | 6df7240 (with skeleton) | After this round |
|---|---|---|
| Sidebar: Pages | 413 | 111 |
| Sidebar: Programmes | 380 | 92 |
| Edit a programme (from its list) | 182 | 168 |
| Sidebar: Testimonials | 391 | 99 |
| Edit a testimonial | 108 | 86 |
| Sidebar: Media library | 388 | 139 |
| Sidebar: Enquiries | 377 | 95 |
| Sidebar: Settings | 388 | 134 |
| Sidebar: Dashboard | 389 | 134 |

What changed, and why:

- **No loading skeleton.** React keeps a Suspense fallback on screen for at least 300 ms (verified in the React bundled with Next 16.4.5), so every sidebar click took about 390 ms. Removed again; the clicked link's spinner (`AdminLink`) gives instant feedback, and search-palette jumps show a thin progress bar (a transition, not a fallback).
- **No entrance animations** on screen titles and dashboard cards.
- **One Supabase Auth call per request instead of two.** `src/proxy.ts` calls `getSession()`, which renews the cookie only in the token's last 90 seconds and otherwise makes no network call. The authorisation check is unchanged: `getSessionUser()` still calls `getUser()` on every page and action.
- **The bell and the Ctrl+K search are plain requests** (`/api/admin/pulse`, `/api/admin/search`), not server actions, so they never queue behind a save; stale searches are cancelled as you type. The search is a POST so names and emails never appear in addresses or logs.
- **Rich-text editor** (about 130 KB compressed) loads in idle time after the admin opens, without Suspense, so editors open without waiting for it.
- **Database:** connections stay open for 120 s instead of 20 s, so a click after a pause does not pay for a new TCP/TLS/sign-in handshake; `fetch_types: false` drops a catalogue query from every new connection (safe while no column is an array; `tests/unit/db.test.ts` checks).
- **Fewer queries per editor:** each editor reads only the reference lists its fields use, and programme, article, enquiry and settings screens run their queries in parallel instead of one after another.
- **Dashboard refresh** on returning to the tab waits a moment, only runs when the figures are out of date, and is cancelled by a link press. Media library video tiles fetch their first frame only near the viewport.

Local mode has no Supabase Auth and no pooler, so the Auth and connection savings do not show in the table above; on the live site they come on top of it.

## What still needs doing

1. Done: deployed on 19 October 2026 (`main` 9a0da50, functions in Mumbai, `bom1`), and the live editors were checked: they open in about 0.3 to 1.2 s.
2. After each deploy, open three or four editors and save one change on the live site to confirm, and check Vercel's logs show no timeouts.
3. The live database may still hold a few sessions left hanging by the old code. They clear themselves when the pooler recycles them; nothing needs to be done unless the dashboard shows connection errors.
4. Supabase Auth is checked twice per admin request (once in `src/proxy.ts` to refresh the session cookie, once by the page). Both checks are needed for the current design, and with the functions in Mumbai each costs a few milliseconds.
