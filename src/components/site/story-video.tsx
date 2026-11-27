"use client";

import { PlayIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { youtubeId } from "@/lib/utils";
import { STORY_PLAY_EVENT, videoFileUrl } from "@/lib/video";

/**
 * The video in a student story (27 November 2026): a still (the YouTube picture,
 * or an MP4's first frame) with a yellow play button; the video itself loads
 * and plays only when the visitor presses play, never on its own. It takes a
 * YouTube link or an MP4 file. Starting it tells a moving stories carousel to
 * stop, so the video never slides away.
 */
export function StoryVideo({ url, title }: { url: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const id = youtubeId(url);
  const file = id ? null : videoFileUrl(url);
  if (!id && !file) return null;

  const start = () => {
    setPlaying(true);
    box.current?.dispatchEvent(new CustomEvent(STORY_PLAY_EVENT, { bubbles: true }));
    track("video_play", { video_title: title });
  };

  return (
    <div ref={box} className="relative aspect-video overflow-hidden rounded-[1.25rem] bg-[#0f0d14]">
      {playing ? (
        id ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <video src={file!} controls autoPlay playsInline className="absolute inset-0 size-full bg-black object-contain" />
        )
      ) : (
        <button type="button" onClick={start} className="group absolute inset-0 size-full cursor-pointer">
          {id ? (
            <Image src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" fill unoptimized sizes="(min-width: 48rem) 28rem, 84vw" className="object-cover opacity-80 transition-opacity group-hover:opacity-95" />
          ) : (
            // The file's own first frame as the still: only its opening bytes load until play is pressed.
            <video src={`${file}#t=0.5`} preload="metadata" muted playsInline aria-hidden tabIndex={-1} className="pointer-events-none absolute inset-0 size-full object-cover opacity-80" />
          )}
          <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-ink-deep shadow-[0_12px_28px_-10px_rgb(0_0_0/0.7)] transition-transform group-hover:scale-105">
            <PlayIcon aria-hidden weight="fill" className="size-7" />
          </span>
          <span className="sr-only">Play video: {title}</span>
        </button>
      )}
    </div>
  );
}
