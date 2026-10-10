import { ArrowRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn, isExternalHref } from "@/lib/utils";

type Variant = "primary" | "secondary" | "blue" | "quiet";

type Props = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: "md" | "sm";
  className?: string;
  /** Conversion event name pushed to analytics on click, e.g. "cta_click". */
  track?: string;
  trackLabel?: string;
  icon?: ReactNode;
} & Omit<ComponentProps<"a">, "href" | "className" | "children">;

/** Infers a tracking event from the destination when one is not given. */
function inferEvent(href: string) {
  if (href.startsWith("https://wa.me/")) return "whatsapp_click";
  if (href.startsWith("tel:")) return "phone_click";
  if (href.startsWith("mailto:")) return "email_click";
  return "cta_click";
}

/** A link styled as a button. Internal links use client-side navigation. */
export function ButtonLink({ href, children, variant = "primary", size = "md", className, track, trackLabel, icon, ...rest }: Props) {
  const classes = cn("btn", `btn-${variant}`, size === "sm" && "btn-sm", className);
  const tracking = {
    "data-track": track ?? inferEvent(href),
    "data-track-label": trackLabel ?? (typeof children === "string" ? children : undefined),
  };
  const special = /^(https?:|mailto:|tel:)/i.test(href);
  if (special) {
    const external = isExternalHref(href);
    return (
      <a
        href={href}
        className={classes}
        {...tracking}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      >
        {icon}
        {children}
        {external && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...tracking} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

/** Inline text link with a trailing arrow. */
export function TextLink({
  href,
  children,
  className,
  track,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  track?: string;
}) {
  const external = isExternalHref(href);
  const tracking = { "data-track": track ?? inferEvent(href), "data-track-label": typeof children === "string" ? children : undefined };
  const Arrow = external ? ArrowUpRightIcon : ArrowRightIcon;
  const inner = (
    <>
      <span>{children}</span>
      <Arrow aria-hidden weight="bold" className="size-4 shrink-0" />
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </>
  );
  if (/^(https?:|mailto:|tel:)/i.test(href)) {
    return (
      <a href={href} className={cn("text-link", className)} {...tracking} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cn("text-link", className)} {...tracking}>
      {inner}
    </Link>
  );
}
