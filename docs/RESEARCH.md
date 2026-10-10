# Research record

What was learnt from the two reference websites on 10 October 2026, how it was learnt, and which claims remain unresolved. Nothing here is invented: every fact is traceable to a page that was read.

## Method

| Source | How it was read |
|---|---|
| butterflycoachingacademy.com | Every page in its WordPress sitemap was fetched. Page HTML and the WordPress REST export of the blog were saved for content migration. Brand colours, type and metadata were read from the live homepage in a browser |
| ipeccoaching.com | The homepage structure was read, then colours, type and component styles were taken from **computed styles** and from the site's **own stylesheets** in a browser. See [BRAND_SYSTEM.md](BRAND_SYSTEM.md) |

Both sites were fully accessible. No limitation prevented research.

## 1. Butterfly Coaching Academy: verified facts

### Business

| Fact | Source page |
|---|---|
| Legal name: Butterfly Coaching Academy Pvt. Limited | Footer, every page |
| Address: Flat No T-8118A, 8th Floor, Block 30, Rangoli Gardens, Jaipur 302034 | Footer, every page |
| Phone and WhatsApp: +91 96100 93337 (`wa.me/919610093337`) | Header and footer |
| Email: contact@butterflycoachingacademy.com | Footer |
| Founded in 2022 by Anup Mittal | /our-team/coach-anup/ |
| Offers coach education, mentoring and supervision, individual coaching and corporate leadership development | /about-us/ |
| Values: simplicity, inclusiveness, ownership, positive impact | /about-us/, /coaching-certifications/ |
| Programmes delivered primarily in English with Hindi support, in small cohorts | Programme pages |

### Founder: Anup Mittal

Source: /our-team/coach-anup/.

- Master Certified Coach (MCC), ICF. Executive and leadership coach, coach trainer and mentor.
- Left a 16+ year corporate career in sales and marketing in 2018 to coach. 24+ years of professional experience overall.
- More than 4,100 hours of one-to-one coaching; has trained and mentored hundreds of coaches toward ACC, PCC and MCC.
- Has delivered group coaching for Amazon, upGrad, Vodafone, AU Bank and Axis Bank.
- Born in Ajmer, lives in Jaipur. LinkedIn: linkedin.com/in/anupmittal.

### Faculty

Source: /our-team/ and each profile page. All four are listed as PCC.

| Name | Summary used on the new site |
|---|---|
| Kanika Vijai | Leadership and strengths coach; 900+ coaching hours; 18+ years in marketing and brand strategy; Gallup Global Strengths Coach |
| Vijay Srinivasan | Leadership transition coach; 30+ years of corporate experience including as COO |
| Sucheta Kulkarni | Business, leadership and executive coach; 23 years corporate, 8+ years coaching |
| Misk Khurana | Productivity and performance coach; 10+ years leading large-scale programmes |

### Programmes

| Programme | Facts taken from its page |
|---|---|
| Level 1: ACC (/level-1-acc-coach-program/) | "77 hours of ICF Level 1 accredited coach education"; 10 hours mentoring and feedback; 75 coaching experience hours; seven-step journey; four audiences |
| Level 2: PCC (/level-2-pcc-coach-program/) | "140 hours of ICF Level 2 accredited coach education"; 10 hours mentor coaching; 500 coaching experience hours; requires an ACC-level pathway |
| Level 3: MCC (/level-3-mcc-program/) | 95 hours of coach education; 2,500 hours of coaching experience; requires a PCC-level pathway |
| Mentoring and Supervision | One-to-one; for ACC, PCC and MCC; traditional and updated ICF pathways; four-step mentor coaching process |
| Coaching Services | Life, executive, career, productivity and business coaching; one-to-one |
| Corporate Programs | Manager as a Coach, Leader as a Coach, Power of Presence, bespoke journeys |

**Not stated anywhere on the site:** fees, cohort dates, programme duration, delivery format (online or in person), brochures. The new site therefore shows none of these, and each is an empty, editable field in the admin.

### The iKAN framework

Source: /coaching-certifications/. i: Identify (the hidden need). K: Known and unknown (blind spots). A: Alternate path (the best course). N: Action and repeat (momentum).

### Testimonials

Twelve testimonials on /testimonial/, migrated **word for word**, with nine authentic photographs. No video testimonials exist.

### Blog

Thirteen articles (October 2023 to February 2026), imported from the WordPress REST API with their original addresses, dates, category and tags.

### Gallery

Twenty event photographs and four YouTube videos from the founder's channel. Ten photographs were selected for the new gallery; those dominated by a client's branding were left out.

## 2. Unresolved claims and inconsistencies

These were found on the existing site and are **not resolved by guessing**. Each is in [CONTENT_APPROVAL_CHECKLIST.md](CONTENT_APPROVAL_CHECKLIST.md) for the owner.

| # | Issue | What the new site does |
|---|---|---|
| 1 | **Level 3 accreditation.** The MCC page says "95 hours of ICF Level 3 accredited coach education" and the site shows a Level 3 badge, but the founder's page says BCA "currently holds accreditation for ICF Level 1 and Level 2 programs and is on its way to achieve Level 3 accreditation" | **Resolved 10 October 2026.** The owner confirmed BCA holds Level 3 accreditation, so the site says "ICF Level 3 accredited" and shows the badge. Before that it was held back |
| 2 | **Hours disagree between pages.** The overview page lists 60 / 125 / 200 education hours and 100 / 500 / 2,500 experience hours (ICF's own credential minimums). The programme pages list 77 / 140 / 95 education hours and 75 / 500 / 2,500 | The programme pages' figures are used, as they describe BCA's programmes. The ACC experience figure (75 against ICF's 100) needs checking |
| 3 | **"One of only 4 organisations in India"** supporting MCC-level coaches (MCC page) | Not used |
| 4 | **"Growing community of more than 100+ satisfied coaches"** and a counter reading "0+ years of experience" | Not used |
| 5 | **Power of Presence** has the same description as Leader as a Coach on the existing site (a copy error) | A short description was written from the shared wording. Needs the owner's real description |
| 6 | **ICF Foundation scholarship cohorts** ("currently leading his second cohort") | Not used: "currently" may be out of date |
| 7 | **Two email addresses** (contact@ and coachanup@) and a "Call us" link that dials a different number (+1 840 841 256) | The new site uses contact@ and +91 96100 93337 everywhere |
| 8 | **Blog articles contain statistics** that could not be traced, and one article reports outcome percentages for BCA participants with unnamed quotes | Articles are migrated as written; the one with BCA outcome claims is held as a draft |
| 9 | **Name spellings**: "Vijay Sriniwasan" on the testimonial, "Vijay Srinivasan" on the team page; "Cecilla Fretias" against a file named "Cecillia" | The team-page spelling is used for Vijay; Cecilla is as published |
| 10 | **Client logos** appear on the existing site without any statement of permission | Shown on the Corporate page only, flagged for confirmation |

### Faults on the existing site that were not carried over

- Menu items "ACC / PCC / MCC" under "Form" that link nowhere.
- A Services card linking to a theme demo on another domain.
- An "Assessments" page that says only "Coming Soon".
- Missing page titles and meta descriptions; no Open Graph tags or structured data.
- No working contact form on the Contact page; no booking link.
- Faculty LinkedIn links pointing at the wrong profiles.

## 3. Legacy addresses

Every address in the existing sitemap still works on the new site:

| Existing address | New site |
|---|---|
| `/`, `/about-us/`, `/contact-us/`, `/testimonial/`, `/blog/`, `/coaching-certifications/`, the three programme pages, the three `/services/...` pages, `/image-gallery/` | Same address |
| All 13 blog articles at `/<slug>/` | Same address (one held as a draft, temporarily redirected to `/blog/`) |
| `/our-team/` and five profile pages | Redirect to `/about-us/#team` |
| `/services/` | Redirects to `/coaching-certifications/` |
| `/video-gallery/` | Redirects to `/image-gallery/#videos` |
| `/assessments/` | Temporary redirect to `/services/corporate-programs/` |
| `/home-2/`, `/linkedln-profile-post/` | Redirect to `/` and `/blog/` |
| `/blog/page/N/` | Redirects to `/blog/?page=N` |

Redirects are managed in **Admin > Redirects**.

## 4. iPEC: what was studied and what BCA took from it

iPEC was the reference for quality and clarity, not a template.

| Observed on iPEC | How BCA applies the idea |
|---|---|
| A short hero with one message and two actions | "Learning that stays", one sentence, two buttons |
| "Choose your path" routing three audiences straight after the hero | Three pathways, with the main one given more weight |
| Accreditation and client logos used as early proof | A slim trust strip under the hero with the two verified ICF marks and three verified facts |
| A dedicated "how we're different" section | "Why learners choose BCA": three points |
| Testimonials with names | BCA's own, word for word, with real photographs |
| A consistent yellow pill button for the main action | The same idea, in BCA's shape system |
| White header, blue and navy sections, pale blue backgrounds | The verified palette, with navy headings |
| A persistent "talk to admissions" action | "Book a discovery call" in the header on every page |

**Not taken:** iPEC's logo, artwork, photographs, code, copy, typeface (Poppins) or its long, carousel-heavy homepage.
