import { WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";

/**
 * Floating WhatsApp shortcut. Compact, pinned to the bottom-right corner with
 * safe-area insets, and hidden while the cookie banner is open on phones so
 * the two never overlap. The footer reserves room so it never covers links.
 */
export function WhatsAppButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-track="whatsapp_click"
      data-track-label="Floating button"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-[var(--z-floating)] grid size-14 place-items-center rounded-full bg-[#0f7a5f] text-white shadow-lift transition-transform duration-200 hover:scale-105 max-sm:[html[data-consent-open]_&]:hidden print:hidden"
    >
      <WhatsappLogoIcon aria-hidden weight="fill" className="size-7" />
      <span className="sr-only">Chat with us on WhatsApp (opens in a new tab)</span>
    </a>
  );
}
