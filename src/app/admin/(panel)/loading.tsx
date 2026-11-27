import { Butterfly } from "@/components/ui/effects";

/** Shown the instant an admin link is clicked, until the next screen arrives. */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading</p>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="grid gap-3">
          <div className="admin-skeleton h-3 w-24" />
          <div className="admin-skeleton h-9 w-64 max-w-[70vw]" />
          <div className="admin-skeleton h-4 w-96 max-w-[80vw]" />
        </div>
        <Butterfly flap="slow" sizes="48px" className="hidden size-12 opacity-80 sm:block" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="admin-skeleton h-28 rounded-3xl" />
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-surface">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 border-t border-line px-5 py-4 first:border-t-0">
            <div className="admin-skeleton h-4 flex-1" style={{ maxWidth: `${60 - i * 6}%` }} />
            <div className="admin-skeleton h-5 w-20 rounded-full" />
            <div className="admin-skeleton h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
