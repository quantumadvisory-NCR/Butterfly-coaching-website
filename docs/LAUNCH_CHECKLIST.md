# Launch checklist

Work through this in order. Items marked **Built and tested** are done in the code and covered by automated tests; they are listed so you can see what has been verified. Everything else needs you.

## 1. Content sign-off

- [ ] Every item in [CONTENT_APPROVAL_CHECKLIST.md](CONTENT_APPROVAL_CHECKLIST.md) is resolved, above all the accreditation wording and programme facts.
- [ ] Privacy Policy and Terms of Use are approved by a legal adviser, and the "drafted for review" line is removed from each.
- [ ] Image rights and consents are confirmed ([IMAGE_ASSETS.md](IMAGE_ASSETS.md)).

## 2. Infrastructure

- [ ] Supabase project created; migrations and seed applied ([DEPLOYMENT.md](DEPLOYMENT.md), steps 1 to 4).
- [ ] Application deployed with production environment variables; `BCA_LOCAL_MODE` is **not** set.
- [ ] `NEXT_PUBLIC_SITE_URL` is the final `https://` address.
- [ ] Owner account created, then `ADMIN_SETUP_TOKEN` removed or rotated.
- [ ] **The Supabase checks in DEPLOYMENT.md step 6 all pass** (sign-in, session refresh, upload, replace, delete). These could not be tested during the build.
- [ ] Supabase **Advisors > Security** shows no warnings about row level security.
- [ ] Database backups are in place.

## 3. Integrations

- [ ] Notification email configured and a test enquiry arrives (or you have decided to rely on the admin inbox).
- [ ] Booking link added in Settings (or you are happy for "Book a discovery call" to open the enquiry form).
- [ ] Analytics ID added if wanted; the consent banner appears; events show in your analytics after you accept.
- [ ] Social links added.
- [ ] WhatsApp and phone links open correctly on a real phone.

## 4. Test on the live address

- [ ] Submit each form: general, programme, corporate, mentoring, coaching and discovery call. Each appears in **Enquiries**.
- [ ] Newsletter signup appears in **Subscribers**.
- [ ] Edit a page, save a draft, confirm the live page is unchanged, preview at phone size, then publish.
- [ ] Change a programme detail and see it on the programme page and its card.
- [ ] Upload, use and replace an image.
- [ ] Open the site on at least one iPhone and one Android phone, and one laptop.

## 5. Search engines and the switch-over

- [ ] Open `/sitemap.xml` and `/robots.txt` on the live address.
- [ ] Old addresses redirect: try `/our-team/`, `/services/` and an old article address.
- [ ] Point the domain at the new site. Keep the old site reachable for a few days in case you need to check something.
- [ ] Add the site to Google Search Console and submit the sitemap.
- [ ] Share a page on WhatsApp and LinkedIn to check the preview image and text.
- [ ] Watch Search Console for "not found" pages for two weeks and add a redirect for any old address you missed.

## 6. Measured during the build

Run on a production build on the development machine on 10 October 2026. Re-measure on the live address, where network conditions differ.

| Check | Result |
|---|---|
| Type check, lint | Clean |
| Unit and database tests | 59 of 59 passing |
| End-to-end tests | 269 of 269 passing, including 18 pages at 11 screen sizes and the admin at 3 |
| Accessibility scan (axe, WCAG 2.2 A and AA) | No violations on 9 pages at phone and desktop sizes |
| Lighthouse, mobile | Performance 84 to 96, accessibility 100, best practices 100, SEO 100 |
| Lighthouse, desktop | Performance 100, accessibility 97 to 100, best practices 100, SEO 100 |
| `npm audit --omit=dev` | 0 vulnerabilities in production packages |

Details, limits and the list of things not yet verified are in [RESPONSIVE_QA_REPORT.md](RESPONSIVE_QA_REPORT.md).

## What is built and tested

Each line is covered by an automated test in `tests/`.

**Public site**

- Built and tested: all required pages exist and return 200; unknown addresses return a real 404.
- Built and tested: the mandatory hero copy is present word for word.
- Built and tested: no horizontal overflow, clipped text, wrapped buttons, broken images or overlapping hero content on 18 pages at 11 viewport sizes.
- Built and tested: unique titles, descriptions and canonical addresses; sitemap; robots; structured data without invented ratings.
- Built and tested: legacy addresses redirect.
- Built and tested: keyboard navigation, skip link, mobile drawer, accordions; no WCAG A or AA violations found by axe on the key pages at phone and desktop sizes.
- Built and tested: no third-party requests on first load.

**Forms and leads**

- Built and tested: validation with clear errors; what was typed survives a failed submission.
- Built and tested: enquiries are stored with their source page and appear in the inbox; status and notes work.
- Built and tested: honeypot, forged-token rejection and rate limiting.
- Built and tested: newsletter signup without duplicates.

**Admin and security**

- Built and tested: first-run setup needs the token and closes afterwards; weak passwords are refused.
- Built and tested: every admin area, preview, upload and export is closed to anonymous visitors.
- Built and tested: an editor cannot reach settings, users, the audit log, redirects, navigation or exports.
- Built and tested: drafts are private; publishing, republishing, restoring a version and unpublishing behave correctly.
- Built and tested: programme and settings changes appear on the public site immediately.
- Built and tested: uploads are type-checked and optimised; images in use on the live site cannot be deleted.
- Built and tested: row level security is enabled on every table with no public policies.
- Built and tested: the admin is usable at phone, tablet and desktop widths.

**Not yet verified, because it needs your accounts**

- Supabase Auth sign-in and session refresh.
- Supabase Storage uploads.
- Resend email delivery.
- Analytics events arriving in your analytics property.
- Behaviour on real devices and on the production network.
