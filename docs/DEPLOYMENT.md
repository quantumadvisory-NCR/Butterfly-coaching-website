# Deployment guide

How to take the site from this folder to a live website: Supabase for the database, sign-in and file storage; Vercel (or any Node.js host) for the application.

Allow about an hour for the first deployment.

> **Status of the Supabase integration.** The database schema, every query and the whole CMS are tested against real PostgreSQL. The Supabase-specific pieces (Supabase Auth sign-in and Supabase Storage uploads) follow Supabase's documented patterns but have **not yet been run against a live Supabase project**, because no credentials were available during the build. Step 6 below is the check that confirms them. Do not skip it.

## What you need

- A [Supabase](https://supabase.com) account (the free tier is enough to start).
- A [Vercel](https://vercel.com) account, or another host that runs Node.js 22 or later.
- The domain's DNS settings.
- Optional: a [Resend](https://resend.com) account for enquiry notification emails.

## 1. Create the Supabase project

1. In Supabase, create a **New project**. Choose a region close to your visitors (for India, Mumbai `ap-south-1`).
2. Set a strong database password and keep it safe.
3. When the project is ready, collect four values:

| Value | Where to find it |
|---|---|
| Project URL | Project Settings > Data API |
| `anon` public key | Project Settings > API Keys |
| `service_role` secret key | Project Settings > API Keys |
| Database connection string | **Connect** (top bar) > **Transaction pooler**. It uses port `6543`. Replace `[YOUR-PASSWORD]` with the database password |

The `service_role` key and the connection string are secrets. They must never appear in browser code, a public repository or a screenshot.

## 2. Configure the environment

Copy `.env.example` to `.env.local` and fill it in:

```bash
NEXT_PUBLIC_SITE_URL=https://www.your-domain.com

# Remove BCA_LOCAL_MODE (or set it to 0) for production
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://postgres.xxxxxxxx:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
SUPABASE_STORAGE_BUCKET=media

SESSION_SECRET=<64 random hex characters>
ADMIN_SETUP_TOKEN=<48 random hex characters>
```

Generate the two secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. Create the tables

From the project folder, with `.env.local` pointing at Supabase:

```bash
npm install
```

```bash
npm run db:migrate
```

This applies the SQL in `supabase/migrations/`. It creates every table, enables row level security on all of them with no public policies, revokes access from the public API roles, links staff profiles to Supabase Auth, and creates the public `media` storage bucket.

Prefer the dashboard? Paste each file from `supabase/migrations/` into the Supabase **SQL Editor**, in filename order, and run it.

## 4. Load the launch content

```bash
npm run db:seed
```

This loads the pages, programmes, testimonials, FAQs, navigation, redirects, blog articles and the media library. It is safe to run again: it updates the seeded records in place and never touches users, enquiries or subscribers.

**Do not run `npm run db:reset` on a live site.** It wipes all content first.

After seeding a site that is already running, save any setting in the admin (or redeploy) so the site's cache picks up the change.

## 5. Deploy the application

### Vercel

1. Push the project to a private Git repository and import it into Vercel. The framework is detected as Next.js.
2. Under **Settings > Environment Variables**, add every variable from step 2 **except** `BCA_LOCAL_MODE`. Add the email variables from step 7 if you are using them.
3. Deploy.
4. Under **Settings > Domains**, add your domain and follow the DNS instructions.
5. Set `NEXT_PUBLIC_SITE_URL` to the final `https://` address and redeploy.

Vercel serverless functions accept request bodies up to about 4.5 MB, which is why `MAX_UPLOAD_MB` defaults to 4. Web images should be well under that; compress larger PDFs before uploading.

### Another Node.js host

```bash
npm ci
```

```bash
npm run build
```

```bash
npm run start
```

Run it behind HTTPS with the same environment variables. The site listens on port 3000 by default (`npm run start -- -p 8080` to change it).

## 6. Create the owner account and verify Supabase

1. Open `https://www.your-domain.com/admin/`. You are taken to **Create the owner account**.
2. Enter the `ADMIN_SETUP_TOKEN`, your name, email and a strong password. See [ADMIN_SETUP.md](ADMIN_SETUP.md).

Then confirm the Supabase-specific pieces, since these could not be tested during the build:

- [ ] **Sign-in works**: you landed on the dashboard, and Supabase > Authentication > Users shows your account.
- [ ] **Sign out and sign in again** works.
- [ ] **Stay signed in**: leave the admin open for more than an hour, then navigate. You should still be signed in (this confirms the session refresh in `src/proxy.ts`).
- [ ] **Upload works**: Media library > upload an image. It appears, and Supabase > Storage > `media` contains the file.
- [ ] **The uploaded image displays** on a page (add it to a draft and preview).
- [ ] **Replace and delete** work on that uploaded image.
- [ ] **Dashboard > Setup status** says Supabase is connected, and no yellow "local development mode" banner is shown.
- [ ] **The public API is closed**: in the Supabase dashboard, **Advisors > Security** reports no table without RLS.

If any of these fail, the adapters to look at are `src/lib/auth/supabase.ts` and `src/lib/storage.ts`.

## 7. Enquiry notification emails (optional)

Without this, enquiries are still saved and shown in the admin inbox; no email is sent, and the dashboard says so.

1. Create a Resend account and verify your sending domain.
2. Create an API key.
3. Add to the environment and redeploy:

```bash
RESEND_API_KEY=re_...
EMAIL_FROM="BCA Website <website@your-domain.com>"
ENQUIRY_NOTIFY_TO=contact@butterflycoachingacademy.com
```

`ENQUIRY_NOTIFY_TO` accepts several addresses separated by commas. If it is empty, the contact email in **Settings** is used.

4. Submit a test enquiry. Open it in the admin: **Notification email** should read "Sent to the team".

## 8. Settings to complete in the admin

In **Settings**:

- **Booking and analytics**: your booking link, and a Google Analytics 4 or Tag Manager ID if you use one. Keep the consent banner on.
- **Social links**.
- **Contact details**: check them, and add a Google Maps embed link only if you want a map.

If you add an embed or script from a new provider later, its domain must be added to the Content Security Policy in `next.config.ts`.

## 9. Before you switch the domain

Work through [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) and [CONTENT_APPROVAL_CHECKLIST.md](CONTENT_APPROVAL_CHECKLIST.md).

## Maintenance

| Task | How |
|---|---|
| Update content | The admin. No deployment needed |
| Update dependencies | `npm update`, then `npm run check` and `npm run test:e2e` before deploying |
| Change the database structure | See "Changing the database" in [ARCHITECTURE.md](ARCHITECTURE.md) |
| Back up | Supabase takes automatic daily backups on paid plans. On the free tier, export regularly from the dashboard |
| Review access | **Users** and **Audit log** in the admin |
| Rotate a secret | Change it in the environment and redeploy. Changing `SESSION_SECRET` invalidates forms that are open in visitors' browsers at that moment, nothing more |

## Hardening options

These are not required for launch but are worth doing as the site grows:

- **A dedicated database role.** The app connects with Supabase's default `postgres` role. For least privilege, create a role that has only the table privileges the app needs, and use its credentials in `DATABASE_URL`.
- **Network restrictions** on the Supabase database, limited to your host's addresses.
- **A CAPTCHA** on forms if spam gets past the built-in honeypot, timing token and rate limit.

## Local development

No accounts needed:

```bash
npm install
```

```bash
npm run dev
```

With `BCA_LOCAL_MODE=1` in `.env.local`, this starts an embedded PostgreSQL server, creates the tables, loads the launch content and opens the site at http://localhost:3000. Data lives in `.local/` and never leaves the machine.
