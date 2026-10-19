"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";

/** A small spinner that appears on the link the moment it is clicked, until the next screen arrives. */
function Pending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden
      className="ml-1.5 inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent align-[-2px]"
    />
  );
}

/**
 * Link for the admin. Every admin screen is personal and uncached, so links do
 * not prefetch: a list of thirty records used to fire thirty background
 * requests, each one checking the sign-in with Supabase and querying the
 * database. Instead the clicked link shows a spinner straight away and the
 * screen's loading skeleton follows, so a click never looks ignored.
 */
export function AdminLink({ children, prefetch = false, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link prefetch={prefetch} {...props}>
      {children}
      <Pending />
    </Link>
  );
}
