/**
 * Media library seed and the single source for docs/IMAGE_ASSETS.md
 * (`npm run docs:images`). Every image the site ships with is listed here
 * with its provenance, licence status, alt text and where it is used.
 */

export type MediaSeed = {
  /** Stable key used by seed content to reference this asset. */
  key: string;
  /** Public path under /public. */
  url: string;
  source: "bca" | "stock" | "ai";
  alt: string;
  caption?: string;
  licence: string;
  sourceUrl?: string;
  credit?: string;
  usedOn: string;
  focal?: [number, number];
};

const BCA_SITE = "https://butterflycoachingacademy.com";
const BCA_LICENCE = "Authentic BCA asset from the existing website. Owner to confirm rights before launch.";
const AI_LICENCE = "AI-generated with Higgsfield (model reported as nano_banana_2) on the owner's account. No real person depicted.";
const AI_CREDIT = "Generated with Higgsfield";

const ai = (name: string, alt: string, usedOn: string, focal?: [number, number]): MediaSeed => ({
  key: `photo.${name}`,
  url: `/images/photography/${name}.jpg`,
  source: "ai",
  alt,
  licence: AI_LICENCE,
  credit: AI_CREDIT,
  usedOn,
  focal,
});

const person = (slug: string, name: string, role: string, legacy: string, usedOn: string): MediaSeed => ({
  key: `person.${slug}`,
  url: `/images/people/${slug}.webp`,
  source: "bca",
  alt: `${name}${role ? `, ${role}` : ""}`,
  licence: "Authentic photograph of a real person from the existing BCA website. Confirm consent before launch.",
  sourceUrl: `${BCA_SITE}/wp-content/uploads/${legacy}`,
  usedOn,
  focal: [0.5, 0.2],
});

const event = (name: string, alt: string, caption: string, legacy: string): MediaSeed => ({
  key: `gallery.${name}`,
  url: `/images/gallery/${name}.jpg`,
  source: "bca",
  alt,
  caption,
  licence: `${BCA_LICENCE} Confirm consent of the people pictured.`,
  sourceUrl: `${BCA_SITE}/wp-content/uploads/2026/01/${legacy}`,
  usedOn: "Gallery page; About and Corporate pages where noted",
});

export const MEDIA: MediaSeed[] = [
  /* ---- brand ---- */
  {
    key: "brand.logo-light",
    url: "/images/brand/bca-logo-on-light.svg",
    source: "bca",
    alt: "Butterfly Coaching Academy",
    licence: "Official BCA logo. Wordmark recoloured from white to navy for light backgrounds; artwork otherwise unchanged. Owner to approve the variant.",
    sourceUrl: `${BCA_SITE}/wp-content/uploads/2026/01/footer-logo.svg`,
    usedOn: "Site header, admin",
  },
  {
    key: "brand.logo-dark",
    url: "/images/brand/bca-logo-on-dark.svg",
    source: "bca",
    alt: "Butterfly Coaching Academy",
    licence: "Official BCA logo, unmodified.",
    sourceUrl: `${BCA_SITE}/wp-content/uploads/2026/01/footer-logo.svg`,
    usedOn: "Site footer",
  },
  {
    key: "brand.mark",
    url: "/images/brand/bca-mark.svg",
    source: "bca",
    alt: "Butterfly Coaching Academy butterfly mark",
    licence: "Butterfly emblem extracted from the official BCA logo, unmodified shapes.",
    sourceUrl: `${BCA_SITE}/wp-content/uploads/2026/01/footer-logo.svg`,
    usedOn: "Call-to-action watermark, favicon",
  },

  /* ---- ICF accreditation marks ---- */
  {
    key: "icf.level-1",
    url: "/images/icf/icf-level-1-accredited.webp",
    source: "bca",
    alt: "ICF Level 1 accredited coaching education",
    licence: "ICF accreditation mark as displayed on the existing BCA website. Use is governed by ICF brand guidelines; owner to confirm current accreditation.",
    sourceUrl: `${BCA_SITE}/wp-content/uploads/2026/01/ICF_AccreditationLogos_FINAL-Level1-1024x1024.png`,
    usedOn: "Home trust strip, About, Level 1 programme",
  },
  {
    key: "icf.level-2",
    url: "/images/icf/icf-level-2-accredited.webp",
    source: "bca",
    alt: "ICF Level 2 accredited coaching education",
    licence: "ICF accreditation mark as displayed on the existing BCA website. Use is governed by ICF brand guidelines; owner to confirm current accreditation.",
    sourceUrl: `${BCA_SITE}/wp-content/uploads/2026/01/ICF_AccreditationLogos_FINAL-Level2-1024x1024.png`,
    usedOn: "Home trust strip, About, Level 2 programme",
  },
  {
    key: "icf.level-3",
    url: "/images/icf/icf-level-3-accredited.webp",
    source: "bca",
    alt: "ICF Level 3 accredited coaching education",
    licence: "ICF accreditation mark as displayed on the existing BCA website. Use is governed by ICF brand guidelines. Level 3 accreditation confirmed by the owner on 10 October 2026.",
    sourceUrl: `${BCA_SITE}/wp-content/uploads/2026/01/ICF_AccreditationLogos_FINAL-Level3-1024x1024.png`,
    usedOn: "Home trust strip, About, Level 3 programme",
  },

  /* ---- client logos ---- */
  ...(
    [
      ["amazon", "Amazon", "amazon111.png"],
      ["upgrad", "upGrad", "upgrad010.png"],
      ["vi", "Vi (Vodafone Idea)", "vi11.png"],
      ["axis-bank", "Axis Bank", "axisbank11.png"],
    ] as const
  ).map(
    ([slug, name, legacy]): MediaSeed => ({
      key: `logo.${slug}`,
      url: `/images/logos/${slug}.png`,
      source: "bca",
      alt: name,
      licence: "Third-party trademark, shown on the existing BCA website as a client. Owner to confirm permission to display.",
      sourceUrl: `${BCA_SITE}/wp-content/uploads/2026/02/${legacy}`,
      usedOn: "Corporate Programmes trust strip",
    }),
  ),

  /* ---- people ---- */
  person("anup-mittal", "Anup Mittal", "MCC, founder of Butterfly Coaching Academy", "2026/02/AnupNew.png", "Home founder section, About"),
  person("kanika-vijai", "Kanika Vijai", "PCC", "2026/01/kanikanew.png", "About faculty, Student stories"),
  person("vijay-srinivasan", "Vijay Srinivasan", "PCC", "2026/01/vijay001.png", "About faculty, Student stories"),
  person("sucheta-kulkarni", "Sucheta Kulkarni", "PCC", "2026/01/0034.png", "About faculty"),
  person("misk-khurana", "Misk Khurana", "PCC", "2026/02/misk.jpg", "About faculty"),
  person("supriya-dhongde", "Dr. Supriya Dhongde", "", "2026/02/supriya-1.png", "Student stories, Home"),
  person("sandeep-chugh", "Sandeep Chugh", "", "2026/02/SandeepSingh11.png", "Student stories"),
  person("naved-narayan", "Naved Narayan", "", "2026/02/Naved11.png", "Student stories, Home"),
  person("anup-nayar", "Anup Nayar", "", "2026/02/AnupNayar11.png", "Student stories"),
  person("cecilla-fretias", "Cecilla Fretias", "", "2026/02/Cecillia11.png", "Student stories"),
  person("rajendra-pratap-singh", "Rajendra Pratap Singh", "", "2026/02/Rajendra11.png", "Student stories"),
  person("nand-kishore", "Nand Kishore", "", "2026/02/Nandkishore-1.png", "Student stories"),
  person("anju-nayar", "Anju Nayar", "", "2026/02/AnjuNAyar.png", "Student stories"),
  person("mrinal-bafna", "Mrinal Bafna", "", "2026/02/Mrinal11.png", "Student stories, Home"),

  /* ---- AI-generated editorial photography ---- */
  ai("hero-coaching-conversation", "A coach listens closely as her client talks through an idea, seated in armchairs beside a bright window", "Home hero (phones and tablets)", [0.5, 0.45]),
  ai("hero-coaching-conversation-portrait", "A coach listens closely as her client talks through an idea, seated in armchairs beside a bright window", "Home hero (laptops and desktops)", [0.5, 0.5]),
  ai("path-become-a-coach", "Three learners in a coaching practice session: one coaches a peer while another observes and takes notes", "Home: Become a coach", [0.5, 0.4]),
  ai("path-grow-as-a-leader", "A team leader listens to a colleague explaining an idea at a high table in a bright office", "Home: Grow as a leader", [0.5, 0.4]),
  ai("path-develop-your-organisation", "A leadership team seated in a semicircle during a facilitated workshop", "Home: Develop your organisation", [0.5, 0.5]),
  ai("programme-acc-learning-lab", "A small cohort of learners practising a coaching exercise in pairs while a facilitator observes", "Programmes overview hero, Level 1 programme", [0.5, 0.5]),
  ai("programme-pcc-deep-practice", "An experienced coach sits forward, fully present, while his client pauses to reflect", "Level 2 programme, Individual coaching", [0.55, 0.45]),
  ai("programme-mcc-mastery", "A senior coach listens with a slight smile to a colleague in a book-lined study", "Level 3 programme", [0.4, 0.45]),
  ai("mentoring-session-review", "A mentor and a coach review a coaching session together at a wooden table", "Mentoring and Supervision hero and programme card", [0.6, 0.4]),
  ai("corporate-leadership-workshop", "Managers working in pairs during a leadership development session in a glass-walled meeting room", "Corporate Programmes hero and programme card", [0.4, 0.5]),
  ai("executive-coaching-walk", "A senior leader and her coach walk and talk along a sunlit office corridor", "Individual and Executive Coaching hero and programme card", [0.5, 0.4]),
  ai("reflection-journal", "A professional pauses while writing in a journal by a window in morning light", "Individual coaching page, blog", [0.55, 0.45]),
  ai("practice-feedback", "A peer shares feedback with a coach after a practice session in a bright learning studio", "Home: Why BCA; Mentoring page", [0.5, 0.45]),
  ai("cohort-community", "A group of adult learners sharing a laugh over tea during a break", "Programmes overview: how we build capability", [0.5, 0.45]),
  ai("butterfly-on-leaf", "A blue butterfly resting on a green leaf beside a sunlit window", "About: our story; 404 page; blog; admin sign-in and setup screens (fixed file, not changed from the media library)", [0.7, 0.5]),
  ai("blog-planning-desk", "A hand about to write in an open planner on a wooden desk beside a plant and a cup of tea", "Blog featured image", [0.5, 0.5]),
  ai("blog-conversation-table", "Two colleagues in conversation over coffee at a small table by a window", "Blog featured image", [0.5, 0.5]),
  ai("blog-steps-forward", "A professional climbing a wide stone staircase in early morning light, seen from behind", "Blog featured image", [0.5, 0.5]),
  ai("blog-speaking-with-confidence", "A professional speaking with quiet confidence to a small group of colleagues", "Blog featured image", [0.5, 0.4]),
  ai("blog-repotting-plant", "Hands gently repotting a small green plant into a larger pot", "Blog featured image", [0.5, 0.5]),
  ai("blog-window-reflection", "A person holding a cup of tea looks out of a large window in soft morning light, seen from behind", "Blog featured image", [0.5, 0.5]),
  ai("blog-morning-routine", "Running shoes, a rolled yoga mat, a glass of water and a notebook laid out in early light", "Blog featured image", [0.5, 0.5]),
  ai("blog-founder-at-work", "A founder sketching a plan in a large notebook at a desk in a bright studio office", "Blog featured image", [0.5, 0.4]),
  ai("blog-reviewing-progress", "Two colleagues reviewing a printed chart together at a wooden table", "Blog featured image", [0.5, 0.5]),

  /* ---- authentic BCA event photographs ---- */
  event("bca-community-outdoors", "Members of the Butterfly Coaching Academy community standing together outdoors", "The BCA community", "BCABG.jpg"),
  event("anup-facilitating-leadership-session", "Anup Mittal facilitating a session for a seated audience of professionals", "Anup Mittal facilitating a leadership session", "WhatsApp-Image-2026-01-29-at-3.57.15-PM-2.jpeg"),
  event("anup-with-table-group", "Anup Mittal in conversation with a small group seated around a table during a workshop", "Working with a table group during a workshop", "WhatsApp-Image-2026-01-29-at-3.57.13-PM-1.jpeg"),
  event("corporate-workshop-in-session", "Participants seated at round tables during a workshop led by Anup Mittal", "A corporate workshop in session", "WhatsApp-Image-2026-01-29-at-3.57.14-PM-2.jpeg"),
  event("workshop-cohort-group-photo", "A large group of workshop participants posing together in a conference room", "Workshop participants", "WhatsApp-Image-2026-01-29-at-3.57.12-PM-2.jpeg"),
  event("anup-engaging-audience", "Anup Mittal speaking with a microphone and gesturing toward a seated audience", "Anup Mittal engaging an audience", "WhatsApp-Image-2026-01-29-at-3.57.14-PM.jpeg"),
  event("anup-facilitating-workshop", "Anup Mittal facilitating a workshop, wearing a headset microphone", "Anup Mittal facilitating a workshop", "WhatsApp-Image-2026-01-29-at-3.57.15-PM-1.jpeg"),
  event("leadership-workshop-group", "Workshop participants gathered for a group photograph", "Workshop participants", "WhatsApp-Image-2026-01-29-at-3.57.16-PM-1.jpeg"),
  event("workshop-cohort-celebrating", "A cheerful group of participants posing after a session", "Participants after a session", "4.jpeg"),
  event("young-professionals-cohort", "A group of young professionals with Anup Mittal outside a campus building", "With a group of young professionals", "WhatsApp-Image-2026-01-29-at-3.57.10-PM.jpeg"),
];
