# Responsive QA report

Measured on 10 October 2026 on the development machine. Every number in this report comes from a test run; nothing is estimated. Where something could not be checked, section 12 says so.

## 1. Summary

| Area | Result |
|---|---|
| Public pages at the 11 required viewport sizes | 18 pages at 11 sizes: 198 page checks and 11 hero checks, all passing |
| Admin at phone, tablet and desktop | 9 screens at 3 sizes, all passing |
| Accessibility scan (axe, WCAG 2.2 A and AA) | 9 pages at phone and desktop sizes: no violations |
| Whole end-to-end suite | 269 tests, all passing, on a fresh production build |
| Unit and database tests | 59 of 59 passing |
| Type check and lint | Clean |
| Production build | Succeeds |
| Lighthouse (five pages, mobile and desktop) | Performance 84 to 96 on mobile and 100 on desktop; accessibility 97 to 100; best practices 100; SEO 100. Measured locally, see section 11 |

**Not verified:** real phones and tablets, Safari and Firefox, a screen reader, and the live production address. See section 12.

## 2. How it was tested

- **What was tested**: a real production build (`next build`, then `next start`), not the development server.
- **Data**: the launch content, loaded into a separate test database (`bca_e2e`) so tests never touch working data.
- **Browser**: Chromium 156 driven by Playwright 1.64, with the window set to each viewport size.
- **Machine**: Windows 11, Node.js 24.14, npm 11.9.
- **Motion**: tests run with "reduce motion" switched on, so full-page screenshots show every section. The scroll fade-in is checked separately (section 8).
- **Screenshots**: a full-page screenshot of every page at every size is saved to `test-results/screens/` (225 images per run: 198 public, 27 admin). Phone, tablet and desktop captures were reviewed by eye as well as by the automated checks.

Run it yourself with `npm run test:e2e`. It takes about eight minutes.

## 3. Viewport sizes

All eleven sizes named in the brief.

| Class | Sizes |
|---|---|
| Phone | 320x700, 360x800, 375x812, 390x844, 430x932 |
| Tablet | 768x1024, 1024x768 |
| Laptop and desktop | 1280x800, 1366x768, 1440x900, 1920x1080 |

## 4. Pages

Eighteen pages, covering every template on the site.

| Page | Address |
|---|---|
| Home | `/` |
| Programmes overview | `/coaching-certifications/` |
| Level 1: ACC | `/level-1-acc-coach-program/` |
| Level 2: PCC | `/level-2-pcc-coach-program/` |
| Level 3: MCC | `/level-3-mcc-program/` |
| Mentoring and supervision | `/services/mentor-coaching-supervision/` |
| Coaching services | `/services/coaching-services/` |
| Corporate programmes | `/services/corporate-programs/` |
| About | `/about-us/` |
| Student stories | `/testimonial/` |
| Blog listing | `/blog/` |
| Blog article | `/the-power-of-habits-cultivating-your-path-to-success/` |
| Contact | `/contact-us/` |
| Gallery | `/image-gallery/` |
| Privacy policy | `/privacy-policy/` |
| Terms of use | `/terms-of-use/` |
| Thank you | `/thank-you/` |
| Page not found | any unknown address |

## 5. What is checked on every page at every size

Each of the 198 page checks loads the page, scrolls through all of it so lazy images load, and then confirms:

1. **No sideways scrolling.** The page is no wider than the screen, and no element pokes out past the right-hand edge.
2. **One visible main heading**, and no heading, button or menu link is cut off.
3. **The header is one compact line** (80px or less). From 1024px wide it shows the full menu; below that it shows the menu button.
4. **Buttons stay on one line.**
5. **Touch targets are at least 40px** in both directions on phones: buttons, header and footer links, breadcrumbs and text links.
6. **No broken images.**
7. **Text and image never overlap** in the page's opening section.
8. **The floating WhatsApp button never covers a footer link or field.**

On the homepage, at every size, a further check confirms that the heading "Learning that stays", the supporting sentence and both buttons ("Book a discovery call", "Explore programmes") are visible on the first screen without scrolling, and that the heading takes no more than two lines.

Separate tests confirm that the mobile menu opens, keeps keyboard focus inside it, navigates and closes; that desktop dropdown menus work from the keyboard; and that the pathway comparison table becomes a set of cards on phones.

## 6. How the layout adapts

| Element | Phone | Tablet | Desktop |
|---|---|---|---|
| Navigation | Menu button opening a drawer | Menu button, with "Book a discovery call" kept in the header | Full menu with dropdowns from 1024px |
| Homepage opening | Heading, text and buttons first, wide photo beneath | Same, with a larger photo | Two columns: text beside a tall crop of the photo |
| "Choose your path" cards | One per row | One lead card with two compact cards beneath | One lead card beside two stacked cards |
| Programme cards | One per row | Pathways one per row, services two across | Three across |
| Pathway comparison | A card per pathway | Table, from 768px | Table |
| Learning journey | Vertical numbered steps | Vertical numbered steps | Steps across the page |
| Contact page | One column, full-width fields | One column | Form beside the contact details |
| Footer | One column | Two columns | Four columns |
| Admin | Sidebar becomes a drawer; save bar stays at the foot of the screen | Same as phone | Fixed sidebar; save bar stays at the foot of the screen |

Images are art-directed, not just scaled: the opening photo uses a wide crop when stacked and a tall crop in the two-column layout, and every photo has a focal point so cropping keeps the subject in frame.

## 7. Defects found during QA and fixed

Each of these was caught by the checks above or by reviewing the screenshots, fixed, and is now covered by a passing test.

| # | Defect | Sizes affected | Fix |
|---|---|---|---|
| 1 | The hidden anti-spam field made every page with a form scroll sideways | All phones | The field is now clipped in place instead of being pushed off-screen |
| 2 | The logo link in the header was only 36px tall to tap | Phones | Minimum 44px tap height |
| 3 | Long web addresses and emails in articles ran off the edge | Phones | Long strings may now break anywhere |
| 4 | The floating WhatsApp button covered the Privacy and Terms links | 768px and wider | The footer's last row leaves room for the button |
| 5 | Breadcrumb and blog category links were under 40px tall | Phones | Minimum 44px tap height |
| 6 | The email address broke in the middle of a word in the footer and contact panel | Phones and narrow columns | It now breaks only after the "@", and the footer columns were re-proportioned |
| 7 | Three service cards in a two-column grid left an empty gap | Desktop | Groups of three now sit three across |
| 8 | Inner-page headings ran to four lines beside the image | Desktop | The text column was widened |
| 9 | Admin dashboard cards were 15px wider than the screen | 390px | Grid items may now shrink below the width of their content, across the whole site |
| 10 | The page editor lost its "saved" message straight after saving | All | The editor is no longer rebuilt after a save |
| 11 | With a third accreditation badge added, the last badge dropped onto a row of its own | All | Badges now take their width from their own shape instead of a fixed wide box, so three sit in one line from 320px up |

## 8. Accessibility

- **Automated scan**: axe-core with the WCAG 2.0, 2.1 and 2.2 A and AA rule sets on nine pages (home, programmes, Level 1, corporate, about, stories, blog, contact and the admin sign-in page), each at 390x844 and 1366x768. Result: no violations.
- **Keyboard**: the skip link is the first stop and moves focus to the content; the desktop dropdown menus are operated from the keyboard; the mobile drawer keeps focus inside it until it is closed; the focus outline is at least 2px thick (measured on the header).
- **Zoom**: a programme page laid out at 640px wide, which is what a 1280px window shows at 200% zoom, does not scroll sideways.
- **Reduced motion**: with "reduce motion" on, nothing animates and nothing is left hidden.
- **Scroll fade-in**: with motion on, sections fade in over the first 72px as they enter the screen, so only a thin strip at the very bottom of the screen is ever faint. A test scrolls the homepage and a programme page with motion on and confirms that every section further in than that strip is fully opaque.
- **Colour contrast**: the palette's contrast figures are calculated in [BRAND_SYSTEM.md](BRAND_SYSTEM.md).

An automated scan finds only part of what WCAG covers. A manual screen-reader pass has not been done (section 12).

## 9. Admin on a phone, a tablet and a desktop

Nine admin screens (dashboard, page list, page editor, programme editor, media library, enquiries, settings, navigation, users) are loaded at 390x844, 768x1024 and 1366x768 and checked for sideways scrolling. Below 1024px the test also opens the menu drawer and confirms it fits the screen, opens a section in the page editor, confirms the save bar is on screen, and confirms the "Add section" picker fits within the screen. All pass.

## 10. Functional coverage in the same run

The end-to-end suite also covers behaviour, on the same production build:

| Area | Tests |
|---|---|
| Responsive layout (sections 5 and 6) | 209 |
| Accessibility (section 8) | 22 |
| Search engines, security headers, navigation, content rules | 18 |
| Enquiry forms, spam protection, newsletter | 5 |
| Admin: sign-in, page builder, publishing, media, roles, responsive | 14 |
| First-run owner setup | 1 |

Highlights: drafts stay private until published and can be restored; an editor cannot reach settings, users or exports even by typing the address; uploads are checked and re-encoded; forged or replayed form submissions are refused; nothing loads from an analytics provider until one is configured and the visitor accepts.

## 11. Lighthouse

Lighthouse 13.5 in headless Chrome 154, against the production build served on this computer. Mobile runs use Lighthouse's standard simulated slow 4G connection and a four-times slower processor. Each page was requested once beforehand so the server was warm.

| Page | Device | Performance | Accessibility | Best practices | SEO | Largest paint | Layout shift | Blocking time |
|---|---|---|---|---|---|---|---|---|
| Home | Mobile | 91 | 100 | 100 | 100 | 3.4 s | 0 | 110 ms |
| Home | Desktop | 100 | 100 | 100 | 100 | 0.7 s | 0 | 0 ms |
| Programmes | Mobile | 93 | 100 | 100 | 100 | 3.2 s | 0 | 70 ms |
| Programmes | Desktop | 100 | 97 | 100 | 100 | 0.7 s | 0 | 0 ms |
| Level 1: ACC | Mobile | 84 | 100 | 100 | 100 | 3.1 s | 0 | 330 ms |
| Level 1: ACC | Desktop | 100 | 100 | 100 | 100 | 0.7 s | 0 | 0 ms |
| Blog article | Mobile | 88 | 100 | 100 | 100 | 3.2 s | 0 | 220 ms |
| Blog article | Desktop | 100 | 100 | 100 | 100 | 0.7 s | 0 | 0 ms |
| Contact | Mobile | 96 | 100 | 100 | 100 | 2.7 s | 0 | 70 ms |
| Contact | Desktop | 100 | 100 | 100 | 100 | 0.6 s | 0 | 0 ms |

Every score in this run meets the brief's target of 80 or more. Read the numbers with these points in mind:

- **Mobile performance moves between runs.** It depends on what else the computer is doing. Three full runs were taken during the build; the table shows the last. Across the three, mobile scores ranged from 84 to 96, with one exception: a homepage run taken seconds after the server started scored 73, and three repeat runs straight afterwards scored 90, 92 and 92.
- **Largest paint on mobile is 2.7 to 3.4 seconds** under the simulated slow connection, which is above Google's 2.5 second "good" mark. On the homepage the largest element is the opening photo (about 15 KB as delivered). The local server uses HTTP/1.1, while hosting platforms use HTTP/2 or 3 and a content delivery network, so this is the number most likely to change on the live site. Measure it there.
- **Layout shift is 0 on every page**: nothing moves as the page loads.
- **The single 97** is on the programmes page at desktop size. Lighthouse sampled a card that had just begun to fade in at the bottom edge of its window, while the card's text was still below the screen. The same page has no violations in the axe scan in section 8.

Two things Lighthouse found on its first run were fixed, and the table above is from after the fixes:

| Finding | Fix |
|---|---|
| Best practices 96: the browser recorded a Content-Security-Policy violation | The public forms were pulling the validation library, which tests for `eval`, into the browser. The forms now import only the labels they need, so the library is no longer shipped to visitors |
| The opening photo was not marked as the most important download | It is now loaded eagerly with high priority |

These are local measurements, not a guarantee for the live site. Re-run after deployment.

## 12. What has not been verified

Be clear with stakeholders about these before launch.

| Not verified | Why | What to do |
|---|---|---|
| Real phones and tablets | Tests set a desktop browser to each screen size. That checks layout precisely, but not real touch behaviour, on-screen keyboards, notches or browser toolbars | Check the homepage, one programme page and the contact form on at least one iPhone and one Android phone |
| Safari and Firefox | Tests ran in Chromium only | Open the same pages in Safari (Mac and iPhone) and Firefox. The scroll fade-in is written so browsers without support simply show the content |
| Screen reader | Automated scans cannot judge reading order or announcements | Read the homepage and submit the contact form with VoiceOver or NVDA |
| The live address | Everything ran on one computer, with no real network between visitor and server | Re-run `npm run lighthouse -- https://your-domain` after launch |
| Supabase sign-in and storage, email delivery, analytics | No credentials were available | Follow the checks in [DEPLOYMENT.md](DEPLOYMENT.md) |

## 13. Dependency audit

`npm audit --omit=dev` reports **0 vulnerabilities** in the packages that run in production.

`npm audit` reports 9 advisories (5 high, 4 moderate), all in development tools that are never deployed: the linter's file-matching library (`braces`, through `eslint-config-next`) and an old copy of `esbuild` inside the migration generator (`drizzle-kit`). The only fixes npm offers are downgrades to much older major versions, which would break the tooling, so they were left in place. Re-check with `npm audit` when updating dependencies.

## 14. Re-running the checks

| Command | What it does |
|---|---|
| `npm run check` | Type check, lint, unit and database tests |
| `npm run test:e2e` | Everything in sections 5 to 10, on a fresh production build, with screenshots |
| `npx playwright show-report` | Opens the detailed report from the last run |
| `npm run local:build`, then `npm run local:start`, then `npm run lighthouse` | Lighthouse scores, saved to `test-results/lighthouse/` |
