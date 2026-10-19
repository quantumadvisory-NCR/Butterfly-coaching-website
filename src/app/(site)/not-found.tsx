import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink, TextLink } from "@/components/ui/button-link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

const SUGGESTIONS = [
  { label: "Explore programmes", href: "/coaching-certifications/" },
  { label: "About BCA", href: "/about-us/" },
  { label: "Student stories", href: "/testimonial/" },
  { label: "Resources and insights", href: "/blog/" },
];

export default function NotFound() {
  return (
    <section className="bg-cream">
      <div className="container-site grid items-center gap-10 py-16 md:py-24 lg:grid-cols-2 lg:gap-16">
        <div className="max-w-xl">
          <p className="eyebrow mb-3">Error 404</p>
          <h1 className="text-h1">This page has flown away</h1>
          <p className="mt-4 text-lead">
            The page you were looking for has moved or no longer exists. Here are some good places to pick up the trail.
          </p>
          <div className="mt-8 flex flex-col gap-3 min-[26rem]:flex-row">
            <ButtonLink href="/">Back to the homepage</ButtonLink>
            <ButtonLink href="/contact-us/" variant="secondary">
              Contact us
            </ButtonLink>
          </div>
          <ul className="mt-8 grid gap-x-8 sm:grid-cols-2">
            {SUGGESTIONS.map((item) => (
              <li key={item.href}>
                <TextLink href={item.href}>{item.label}</TextLink>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative aspect-[16/10] overflow-hidden rounded-card lg:rounded-tl-[var(--radius-wing)]">
          <Image
            src="/images/photography/butterfly-on-leaf.jpg"
            alt="A blue butterfly resting on a green leaf beside a sunlit window"
            fill
            sizes="(min-width: 64rem) 46vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
