"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { track } from "@/lib/analytics";

function Fire({ name }: { name: string }) {
  const params = useSearchParams();
  useEffect(() => {
    track(name, { form_type: params.get("type") ?? undefined });
  }, [name, params]);
  return null;
}

/** Fires one analytics event when the page it sits on is viewed (e.g. the thank-you page). */
export function TrackEvent({ name }: { name: string }) {
  return (
    <Suspense fallback={null}>
      <Fire name={name} />
    </Suspense>
  );
}
