import Image from "next/image";
import type { ReactNode } from "react";

/** The butterfly photograph from the brand library. Decorative here, so it carries no alt text. */
const PHOTO = "/images/photography/butterfly-on-leaf-charcoal.jpg";
/** Keeps the butterfly in frame however the photograph is cropped. */
const PHOTO_FOCUS = { objectPosition: "72% 45%" };

/**
 * Frame for the sign-in and first-run setup screens. On large screens the
 * photograph sits in a panel beside the form and stays put while a long form
 * scrolls; on smaller screens it becomes the header of the form card.
 */
export function AuthCard({ title, intro, children, footer }: { title: string; intro?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="grid min-h-dvh bg-page lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="hidden p-4 pr-0 lg:sticky lg:top-0 lg:block lg:h-dvh">
        <div className="relative size-full overflow-hidden rounded-[1.75rem] bg-line">
          <Image src={PHOTO} alt="" fill sizes="45vw" className="object-cover" style={PHOTO_FOCUS} />
        </div>
      </div>

      <div className="grid place-items-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Image
            src="/images/brand/bca-logo-mid-gray.svg"
            alt="Butterfly Coaching Academy"
            width={319}
            height={89}
            unoptimized
            preload
            className="h-11 w-auto"
          />
          <div className="mt-7 overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-lift">
            <div className="relative h-36 sm:h-44 lg:hidden">
              <Image src={PHOTO} alt="" fill sizes="(min-width: 30rem) 28rem, 100vw" className="object-cover" style={PHOTO_FOCUS} />
            </div>
            <div className="p-6 sm:p-8">
              <h1 className="text-2xl tracking-tight">{title}</h1>
              {intro && <div className="mt-2 text-[0.9375rem] text-muted">{intro}</div>}
              <div className="mt-6">{children}</div>
            </div>
          </div>
          {footer && <div className="mt-5 text-sm text-muted">{footer}</div>}
        </div>
      </div>
    </main>
  );
}
