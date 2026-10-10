import {
  CalendarCheckIcon,
  EnvelopeSimpleIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { MapEmbed } from "@/components/site/map-embed";
import { Section, SectionHeading } from "@/components/ui/section";
import { getProgrammes } from "@/lib/content/public";
import { type SiteSettings, mapsSearchHref, telHref, whatsappHref } from "@/lib/settings";
import type { BlockProps } from "./types";

function DetailRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sky text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <div className="font-semibold text-navy [overflow-wrap:anywhere]">{children}</div>
      </div>
    </li>
  );
}

/** Lets a long address wrap after the @ on narrow screens instead of mid-word. */
export function BreakableEmail({ email }: { email: string }) {
  const at = email.indexOf("@");
  if (at < 0) return <>{email}</>;
  return (
    <>
      {email.slice(0, at + 1)}
      <wbr />
      {email.slice(at + 1)}
    </>
  );
}

export function ContactDetails({ settings }: { settings: SiteSettings }) {
  const { contact, integrations } = settings;
  const tel = telHref(contact);
  const whatsapp = whatsappHref(contact);
  const linkClass = "inline-flex min-h-8 items-center underline-offset-4 hover:text-primary hover:underline";
  return (
    <div>
      <ul className="grid gap-5">
        {tel && (
          <DetailRow icon={<PhoneIcon aria-hidden weight="fill" className="size-5" />} label="Call us">
            <a href={tel} data-track="phone_click" className={linkClass}>
              {contact.phoneDisplay}
            </a>
          </DetailRow>
        )}
        {whatsapp && (
          <DetailRow icon={<WhatsappLogoIcon aria-hidden weight="fill" className="size-5" />} label="WhatsApp">
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" data-track="whatsapp_click" className={linkClass}>
              Message us on WhatsApp<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </DetailRow>
        )}
        {contact.email && (
          <DetailRow icon={<EnvelopeSimpleIcon aria-hidden weight="fill" className="size-5" />} label="Email">
            <a href={`mailto:${contact.email}`} data-track="email_click" className={`${linkClass} text-[0.9375rem] sm:text-base`}>
              <BreakableEmail email={contact.email} />
            </a>
          </DetailRow>
        )}
        {integrations.bookingUrl && (
          <DetailRow icon={<CalendarCheckIcon aria-hidden weight="fill" className="size-5" />} label="Discovery call">
            <a href={integrations.bookingUrl} target="_blank" rel="noopener noreferrer" data-track="booking_click" className={linkClass}>
              Choose a time in our calendar<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </DetailRow>
        )}
        {contact.addressLines.length > 0 && (
          <DetailRow icon={<MapPinIcon aria-hidden weight="fill" className="size-5" />} label="Registered office">
            <address className="font-semibold not-italic">
              {contact.legalName && <span className="block">{contact.legalName}</span>}
              {contact.addressLines.map((line) => (
                <span key={line} className="block font-normal text-ink">
                  {line}
                </span>
              ))}
            </address>
            <a
              href={mapsSearchHref(contact)}
              target="_blank"
              rel="noopener noreferrer"
              data-track="map_click"
              className="mt-1 inline-flex min-h-8 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Open in Google Maps<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </DetailRow>
        )}
      </ul>
      {contact.mapEmbedUrl && <MapEmbed src={contact.mapEmbedUrl} />}
    </div>
  );
}

export async function ContactFormBlock({ data, ctx }: BlockProps<"contact_form">) {
  const programmes = (await getProgrammes()).map((p) => ({ id: p.id, name: p.name }));
  return (
    <Section background={data.background} anchor={data.anchor || "enquire"}>
      <div className="container-site grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className={data.showDetails ? "lg:col-span-7" : "mx-auto w-full max-w-3xl lg:col-span-12"}>
          <SectionHeading heading={data.heading} intro={data.intro} />
          <div className="mt-8 rounded-card border border-sky-line bg-surface p-5 shadow-card sm:p-7 md:p-9">
            <EnquiryForm type={data.formType as "general"} programmes={programmes} />
          </div>
        </div>
        {data.showDetails && (
          <aside aria-label="Contact details" className="lg:col-span-5 lg:pt-2">
            <h3 className="text-h3">Prefer to talk?</h3>
            <p className="mt-2 max-w-md">Reach us directly. We usually reply within one working day.</p>
            <div className="mt-7">
              <ContactDetails settings={ctx.settings} />
            </div>
          </aside>
        )}
      </div>
    </Section>
  );
}
