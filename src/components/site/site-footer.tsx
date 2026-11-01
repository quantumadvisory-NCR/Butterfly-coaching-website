import {
  FacebookLogoIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  XLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { BreakableEmail } from "@/components/blocks/contact";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { ICF_BADGES } from "@/components/ui/effects";
import type { NavNode, Navigation } from "@/lib/content/public";
import { type SiteSettings, telHref, whatsappHref } from "@/lib/settings";
import { isExternalHref } from "@/lib/utils";

const SOCIAL = [
  { key: "linkedin", label: "LinkedIn", Icon: LinkedinLogoIcon },
  { key: "instagram", label: "Instagram", Icon: InstagramLogoIcon },
  { key: "facebook", label: "Facebook", Icon: FacebookLogoIcon },
  { key: "youtube", label: "YouTube", Icon: YoutubeLogoIcon },
  { key: "x", label: "X", Icon: XLogoIcon },
] as const;

const linkClass = "inline-flex min-h-11 items-center text-lilac underline-offset-4 transition-colors hover:text-white hover:underline";
const headingClass = "font-text text-[0.8125rem] font-bold uppercase tracking-[0.1em] !text-white";

function FooterLink({ node }: { node: NavNode }) {
  if (isExternalHref(node.href) || node.openInNewTab) {
    return (
      <a href={node.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {node.label}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={node.href} className={linkClass}>
      {node.label}
    </Link>
  );
}

function Column({ title, items }: { title: string; items: NavNode[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label={title}>
      <h2 className={headingClass}>{title}</h2>
      <ul className="mt-3 grid">
        {items.map((node) => (
          <li key={node.id}>
            <FooterLink node={node} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** The footer from the November 2026 design: deep ink, lilac text, the ICF badges in white circles. */
export function SiteFooter({
  settings,
  nav,
  logo,
}: {
  settings: SiteSettings;
  nav: Navigation;
  logo: { src: string; width: number; height: number };
}) {
  const { contact, footer, newsletter, social, brand } = settings;
  const tel = telHref(contact);
  const whatsapp = whatsappHref(contact);
  const socials = SOCIAL.filter((s) => social[s.key]);

  return (
    <footer className="on-dark bg-ink-deep font-text text-lilac">
      {newsletter.enabled && (
        <div className="border-b border-[#2e2840]">
          <div className="container-site grid items-center gap-6 py-10 max-md:py-8 md:py-12 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="font-grotesk text-[clamp(1.375rem,1.2rem+0.8vw,1.75rem)] font-bold tracking-[-0.02em] !text-white">{newsletter.heading}</h2>
              {newsletter.body && <p className="mt-2 max-w-md">{newsletter.body}</p>}
            </div>
            <NewsletterForm consentText={newsletter.consentText} idPrefix="footer" />
          </div>
        </div>
      )}

      {/* Phones and tablets: the brand full width, the two link lists side by side; the contact column is desktop only
          (phone and WhatsApp are one tap away in the menu and the floating buttons). */}
      <div className="container-site grid gap-10 py-9 max-lg:grid-cols-2 max-lg:gap-x-6 max-lg:gap-y-8 lg:grid-cols-[1.15fr_0.95fr_0.75fr_1.45fr] lg:gap-8 lg:py-14">
        <div className="max-w-sm max-lg:col-span-2">
          <Link href="/" aria-label={`${brand.siteName} home`} className="inline-flex rounded-lg">
            <Image src={logo.src} alt={brand.siteName} width={logo.width} height={logo.height} unoptimized={logo.src.endsWith(".svg")} className="h-11 w-auto" />
          </Link>
          {footer.tagline && <p className="mt-5 text-[0.9375rem] leading-relaxed">{footer.tagline}</p>}
          <span role="img" aria-label="ICF accredited at Level 1, 2 and 3" className="mt-5 flex gap-2.5">
            {ICF_BADGES.map((badge) => (
              <span key={badge.src} className="fx-medal grid size-14 place-items-center rounded-full bg-white">
                <Image src={badge.src} alt="" width={48} height={48} sizes="48px" className="fx-medal-img size-12 object-contain" />
              </span>
            ))}
          </span>
          {socials.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {socials.map(({ key, label, Icon }) => (
                <li key={key}>
                  <a
                    href={social[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track="outbound_click"
                    data-track-label={label}
                    className="grid size-11 place-items-center rounded-full border border-white/25 text-white transition-colors hover:border-accent hover:text-accent"
                  >
                    <Icon aria-hidden weight="fill" className="size-5" />
                    <span className="sr-only">{label} (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Column title="Programmes" items={nav.footer_programmes} />
        <Column title="Academy" items={nav.footer_company} />

        <div className="max-lg:hidden">
          <h2 className={headingClass}>Contact</h2>
          <ul className="mt-3 grid">
            {tel && (
              <li>
                <a href={tel} data-track="phone_click" className={linkClass}>
                  {contact.phoneDisplay}
                </a>
              </li>
            )}
            {whatsapp && (
              <li>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" data-track="whatsapp_click" className={linkClass}>
                  WhatsApp us<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            )}
            {contact.email && (
              <li>
                <a href={`mailto:${contact.email}`} data-track="email_click" className={`${linkClass} text-[0.9375rem] [overflow-wrap:anywhere] lg:text-sm xl:text-[0.9375rem]`}>
                  <BreakableEmail email={contact.email} />
                </a>
              </li>
            )}
          </ul>
          {contact.addressLines.length > 0 && (
            <address className="mt-3 text-[0.9375rem] not-italic leading-relaxed text-lilac-soft">
              {contact.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          )}
        </div>
      </div>

      <div className="border-t border-[#2e2840]">
        {/* The floating WhatsApp and "Need help?" buttons step aside when this line comes into view
            (data-footer-end), so the footer ends without empty space kept free for them. */}
        <div
          data-footer-end
          className="container-site flex flex-col gap-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 text-[0.8125rem] text-lilac-soft md:flex-row md:items-center md:justify-between"
        >
          <p>
            © {new Date().getFullYear()} {footer.copyrightName || brand.siteName}. All rights reserved.
          </p>
          {nav.footer_legal.length > 0 && (
            <ul className="flex flex-wrap gap-x-6">
              {nav.footer_legal.map((node) => (
                <li key={node.id}>
                  <FooterLink node={node} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
