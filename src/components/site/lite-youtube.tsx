"use client";

import { PlayIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { track } from "@/lib/analytics";

/**
 * Click-to-load YouTube embed. Shows a still until played, so the player
 * (and its cookies) only load when a visitor chooses to watch.
 */
export function LiteYouTube({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden rounded-card bg-navy">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setPlaying(true);
            track("video_play", { video_title: title });
          }}
          className="group absolute inset-0 size-full"
        >
          <Image
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 48rem) 46vw, 100vw"
            className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
          />
          <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-navy shadow-lift transition-transform group-hover:scale-105">
            <PlayIcon aria-hidden weight="fill" className="size-7" />
          </span>
          <span className="sr-only">Play video: {title}</span>
        </button>
      )}
    </div>
  );
}
