import type { Metadata } from "next";
import { ContactDetails } from "@/components/blocks/contact";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { getSiteChrome } from "@/lib/content/chrome";
import type { MediaMap } from "@/lib/content/public";
import { buildMetadata } from "@/lib/seo";
import { type MasterClass, openMasterClasses, type SiteSettings } from "@/lib/settings";
import { slugify } from "@/lib/utils";

/**
 * Enquiry page for master classes, made for links shared in posts:
 *
 *   /enquire/?class=leaders-communication&utm_source=linkedin&utm_campaign=...
 *
 * The class named in the link is ticked in the form, and the campaign
 * parameters are saved with the enquiry. Classes are edited in
 * Admin > Settings > Master classes.
 */
type Props = { searchParams: Promise<{ class?: string | string[] }> };

/** A photograph from the media library, used for the link preview when nothing else is set. */
const FALLBACK_SHARING_IMAGE = "/images/photography/corporate-leadership-workshop.jpg";

function chosenClass(classes: MasterClass[], raw: string | string[] | undefined) {
  const wanted = slugify((Array.isArray(raw) ? raw[0] : raw) ?? "");
  return wanted ? (classes.find((item) => item.slug === wanted) ?? null) : null;
}

function sharingImage(chosen: MasterClass | null, settings: SiteSettings, media: MediaMap) {
  return (
    media[chosen?.image ?? ""] ??
    media[settings.brand.defaultOgImage ?? ""] ??
    Object.values(media).find((item) => item.url === FALLBACK_SHARING_IMAGE) ??
    null
  );
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [{ class: raw }, { settings, media }] = await Promise.all([searchParams, getSiteChrome()]);
  const chosen = chosenClass(openMasterClasses(settings), raw);
  return buildMetadata({
    title: chosen ? chosen.name : "Enquire about a master class",
    description: chosen?.summary || settings.masterClasses.formIntro,
    // The canonical address keeps the class but never the campaign parameters.
    path: chosen ? `/enquire/?class=${chosen.slug}` : "/enquire/",
    image: sharingImage(chosen, settings, media),
    // A form, not content for search results. Link previews on LinkedIn and WhatsApp still work.
    noindex: true,
    settings,
  });
}

export default async function EnquirePage({ searchParams }: Props) {
  const [{ class: raw }, { settings }] = await Promise.all([searchParams, getSiteChrome()]);
  const classes = openMasterClasses(settings);
  const chosen = chosenClass(classes, raw);
  const heading = chosen ? chosen.name : classes.length > 0 ? "Enquire about a master class" : "Send an enquiry";

  return (
    <section className="bg-page">
      <div className="container-site pb-16 pt-5 md:pb-20 lg:pb-24">
        <Breadcrumbs items={[{ label: "Enquire", href: "/enquire/" }]} />
        <header className="hero-enter mt-6 max-w-3xl md:mt-8">
          {chosen?.label && <p className="eyebrow mb-3">{chosen.label}</p>}
          <h1 className="text-h1">{heading}</h1>
          {chosen?.summary && <p className="mt-4 max-w-2xl text-lead">{chosen.summary}</p>}
        </header>

        <div className="mt-10 grid gap-10 md:mt-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            {settings.masterClasses.formIntro && classes.length > 0 && <p className="max-w-2xl">{settings.masterClasses.formIntro}</p>}
            <div className="mt-6 rounded-card border border-line bg-surface p-5 shadow-card sm:p-7 md:p-9">
              {classes.length > 0 ? (
                <EnquiryForm
                  type="masterclass"
                  programmes={[]}
                  classes={classes.map(({ slug, name }) => ({ slug, name }))}
                  selectedClasses={chosen ? [chosen.slug] : []}
                />
              ) : (
                <EnquiryForm type="general" programmes={[]} />
              )}
            </div>
          </div>
          <aside aria-label="Contact details" className="lg:col-span-5 lg:pt-2">
            <h2 className="text-h3">Prefer to talk?</h2>
            <p className="mt-2 max-w-md">Reach us directly. We usually reply within one working day.</p>
            <div className="mt-7">
              <ContactDetails settings={settings} />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
