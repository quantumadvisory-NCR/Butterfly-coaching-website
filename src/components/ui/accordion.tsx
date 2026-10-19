"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { Accordion as Primitive } from "radix-ui";

export type AccordionItem = { id: string; question: string; answerHtml: string };

/**
 * Accessible FAQ accordion (WAI-ARIA accordion pattern via Radix). Each question
 * is its own warm-white card; the open one gains a yellow edge. Several can be
 * open at once, so answers can be compared.
 */
export function Accordion({ items, numbered = false }: { items: AccordionItem[]; numbered?: boolean }) {
  return (
    <Primitive.Root type="multiple" className="grid gap-3">
      {items.map((item, i) => (
        <Primitive.Item
          key={item.id}
          value={item.id}
          className="group/item relative overflow-hidden rounded-card border border-line bg-surface transition-[border-color,box-shadow] duration-200 hover:border-navy/25 data-[state=open]:border-transparent data-[state=open]:shadow-card"
        >
          <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-accent opacity-0 transition-opacity duration-200 group-data-[state=open]/item:opacity-100" />
          <Primitive.Header asChild>
            <h3 className="m-0 font-sans">
              <Primitive.Trigger className="group flex min-h-16 w-full items-center gap-4 px-5 py-4 text-left text-[1.0625rem] font-semibold leading-snug text-navy sm:px-6">
                {numbered && (
                  <span aria-hidden className="hidden w-7 shrink-0 font-display text-sm font-bold tabular-nums text-muted group-data-[state=open]:text-accent-strong sm:block">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
                <span className="flex-1">{item.question}</span>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-tint text-navy transition-[transform,background-color] duration-300 group-hover:bg-accent-soft group-data-[state=open]:rotate-45 group-data-[state=open]:bg-accent">
                  <PlusIcon aria-hidden weight="bold" className="size-4" />
                </span>
              </Primitive.Trigger>
            </h3>
          </Primitive.Header>
          <Primitive.Content className="accordion-content overflow-hidden">
            <div className={numbered ? "prose px-5 pb-6 sm:pl-[4.25rem] sm:pr-16" : "prose px-5 pb-6 sm:px-6 sm:pr-16"} dangerouslySetInnerHTML={{ __html: item.answerHtml }} />
          </Primitive.Content>
        </Primitive.Item>
      ))}
    </Primitive.Root>
  );
}
