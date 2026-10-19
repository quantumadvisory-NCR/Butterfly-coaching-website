"use client";

import { ArrowLeftIcon, ArrowRightIcon, CaretDownIcon, QuotesIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { Tabs } from "radix-ui";
import { useState } from "react";
import { MediaImage } from "@/components/ui/media-image";
import type { MediaItem } from "@/lib/content/public";
import { cn } from "@/lib/utils";

export type Story = {
  id: string;
  name: string;
  role: string;
  /** The approved short version, when there is one. */
  excerpt: string | null;
  /** The full, unedited words. */
  quote: string;
  photo: MediaItem | null;
};

function Portrait({ story, size }: { story: Story; size: "sm" | "lg" }) {
  const box = size === "lg" ? "size-16 sm:size-[4.5rem]" : "size-11";
  if (!story.photo) {
    return (
      <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-full bg-accent font-display font-bold text-navy", box, size === "lg" ? "text-xl" : "text-base")}>
        {story.name.charAt(0)}
      </span>
    );
  }
  return (
    <span className={cn("relative shrink-0 overflow-hidden rounded-full bg-tint-deep", box, size === "lg" && "ring-[3px] ring-accent")}>
      <MediaImage media={story.photo} fill alt="" sizes={size === "lg" ? "72px" : "44px"} className="!object-top" />
    </span>
  );
}

function FeaturedStory({ story }: { story: Story }) {
  const [expanded, setExpanded] = useState(false);
  const lead = story.excerpt || story.quote;
  const hasMore = Boolean(story.excerpt) && story.excerpt !== story.quote;
  const long = lead.length > 260;
  return (
    <figure className="flex flex-1 flex-col">
      <QuotesIcon aria-hidden weight="fill" className="size-11 text-accent" />
      <blockquote className={cn("mt-5 font-display font-semibold leading-snug tracking-tight text-white", long ? "text-[clamp(1.125rem,1rem+0.6vw,1.375rem)]" : "text-[clamp(1.3125rem,1.05rem+1.1vw,1.875rem)]")}>
        <p>“{lead}”</p>
      </blockquote>
      {hasMore && (
        <div className="mt-4">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={`story-full-${story.id}`}
            onClick={() => setExpanded((open) => !open)}
            className="group inline-flex min-h-11 items-center gap-1.5 rounded-full text-[0.9375rem] font-semibold text-accent underline-offset-4 hover:underline"
          >
            {expanded ? "Show less" : `Read ${story.name.split(" ").filter((part) => !/^(dr|mr|ms|mrs)\.?$/i.test(part))[0] ?? story.name}'s full story`}
            <CaretDownIcon aria-hidden weight="bold" className={cn("size-4 transition-transform", expanded && "rotate-180")} />
          </button>
          <div id={`story-full-${story.id}`} hidden={!expanded} className="mt-3 border-l-2 border-accent/70 pl-4 text-[1.0313rem] leading-relaxed text-white/85">
            <p>“{story.quote}”</p>
          </div>
        </div>
      )}
      <figcaption className="mt-auto flex items-center gap-4 pt-8">
        <Portrait story={story} size="lg" />
        <span>
          <span className="block text-lg font-bold text-white">{story.name}</span>
          {story.role && <span className="block text-[0.9375rem] text-white/75">{story.role}</span>}
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Editorial student stories: one story told large, with the others listed
 * beside it to choose from. The list is a set of tabs, so it works with the
 * keyboard (arrow keys) and screen readers. Nothing advances on its own.
 */
export function StoryShowcase({ stories, label }: { stories: Story[]; label: string }) {
  const [active, setActive] = useState(stories[0]?.id ?? "");
  const index = Math.max(0, stories.findIndex((s) => s.id === active));
  const go = (step: number) => setActive(stories[(index + step + stories.length) % stories.length]!.id);

  return (
    <Tabs.Root value={active} onValueChange={setActive} orientation="vertical" className="grid gap-5 lg:grid-cols-12 lg:gap-6">
      <div className="on-dark relative isolate flex flex-col overflow-hidden rounded-[var(--radius-panel)] bg-navy p-7 sm:p-9 lg:col-span-7 lg:min-h-[30rem] lg:p-11">
        {/* The BCA butterfly, large and quiet in the corner. */}
        <Image
          src="/images/brand/bca-mark-on-dark.svg"
          alt=""
          width={98}
          height={90}
          unoptimized
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -right-8 -z-10 h-56 w-auto opacity-[0.08] sm:h-72"
        />
        {stories.map((story) => (
          <Tabs.Content key={story.id} value={story.id} forceMount className="flex flex-1 flex-col outline-none data-[state=inactive]:hidden data-[state=active]:animate-[fade-in_0.35s_ease-out]">
            <FeaturedStory story={story} />
          </Tabs.Content>
        ))}
        {stories.length > 1 && (
          <div className="mt-7 flex items-center gap-2 border-t border-white/15 pt-5">
            <button type="button" onClick={() => go(-1)} aria-label="Previous story" className="grid size-11 place-items-center rounded-full border border-white/30 text-white transition-colors hover:border-accent hover:bg-accent hover:text-navy">
              <ArrowLeftIcon aria-hidden weight="bold" className="size-4" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next story" className="grid size-11 place-items-center rounded-full border border-white/30 text-white transition-colors hover:border-accent hover:bg-accent hover:text-navy">
              <ArrowRightIcon aria-hidden weight="bold" className="size-4" />
            </button>
            <p aria-live="polite" className="ml-2 text-sm font-semibold text-white/70">
              Story {index + 1} of {stories.length}
            </p>
          </div>
        )}
      </div>

      {stories.length > 1 && (
        <Tabs.List aria-label={label} className="grid content-start gap-3 lg:col-span-5">
          {stories.map((story) => (
            <Tabs.Trigger
              key={story.id}
              value={story.id}
              className="group relative flex min-h-[4.75rem] w-full items-center gap-3.5 rounded-card border border-line bg-surface/60 p-4 text-left transition-[background-color,border-color,box-shadow] duration-200 hover:border-navy/30 hover:bg-surface data-[state=active]:border-transparent data-[state=active]:bg-surface data-[state=active]:shadow-card"
            >
              <span aria-hidden className="absolute inset-y-3 left-0 w-1 rounded-full bg-accent opacity-0 transition-opacity group-data-[state=active]:opacity-100" />
              <Portrait story={story} size="sm" />
              <span className="min-w-0">
                <span className="block font-semibold text-navy">{story.name}</span>
                {story.role && <span className="block text-sm leading-snug text-muted">{story.role}</span>}
              </span>
              <ArrowRightIcon aria-hidden weight="bold" className="ml-auto size-4 shrink-0 text-navy/40 transition-transform group-hover:translate-x-0.5 group-data-[state=active]:text-accent-strong" />
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      )}
    </Tabs.Root>
  );
}
