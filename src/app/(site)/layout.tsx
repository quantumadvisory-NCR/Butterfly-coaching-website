import { Analytics } from "@/components/site/analytics";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SupportDock } from "@/components/site/support-dock";
import { getSiteChrome } from "@/lib/content/chrome";
import { telHref, whatsappHref } from "@/lib/settings";

const GA4 = /^G-[A-Z0-9]{4,}$/;
const GTM = /^GTM-[A-Z0-9]{4,}$/;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const chrome = await getSiteChrome();
  const { settings } = chrome;
  const whatsapp = whatsappHref(settings.contact);
  const ga4Id = GA4.test(settings.integrations.ga4Id) ? settings.integrations.ga4Id : null;
  const gtmId = GTM.test(settings.integrations.gtmId) ? settings.integrations.gtmId : null;

  return (
    <>
      <a
        href="#content"
        className="fixed left-3 top-3 z-[var(--z-toast)] -translate-y-20 rounded-full bg-navy px-5 py-3 font-semibold text-white transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <SiteHeader
        nav={chrome.navigation.header}
        logo={chrome.logoLight}
        siteName={settings.brand.siteName}
        cta={chrome.headerCta}
        tel={telHref(settings.contact)}
        phoneDisplay={settings.contact.phoneDisplay}
        whatsapp={whatsapp}
        announcement={chrome.announcement}
      />
      <main id="content" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter settings={settings} nav={chrome.navigation} logo={chrome.logoDark} />
      <SupportDock panel={chrome.support} whatsapp={whatsapp} />
      <Analytics ga4Id={ga4Id} gtmId={gtmId} requireConsent={settings.integrations.consentBanner} />
    </>
  );
}
