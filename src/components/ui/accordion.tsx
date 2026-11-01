"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { Accordion as Primitive } from "radix-ui";

export type AccordionItem = { id: string; question: string; answerHtml: string };

/**
 * Accessible FAQ accordion (WAI-ARIA accordion pattern via Radix). Each question
 * is its own white card; the open one takes a lavender edge and a soft purple
 * shadow, and its plus turns into a yellow cross (the November 2026 design).
 * Several can be open at once, so answers can be compared.
 */
export function Accordion({ items, numbered = false }: { items: AccordionItem[]; numbered?: boolean }) {
  return (
    <Primitive.Root type="multiple" className="grid gap-3">
      {items.map((item, i) => (
        <Primitive.Item
          key={item.id}
          value={item.id}
          className="group/item reveal relative overflow-hidden rounded-[1.375rem] border border-lilac-line bg-surface transition-[border-color,box-shadow] duration-300 hover:border-lav-200 data-[state=open]:border-lav data-[state=open]:shadow-[0_18px_40px_-30px_rgb(70_45_160/0.6)]"
        >
          <Primitive.Header asChild>
            <h3 className="m-0 font-sans">
              <Primitive.Trigger className="group flex min-h-16 w-full items-center gap-4 px-5 py-4 text-left text-[1.0625rem] font-semibold leading-snug text-navy sm:px-6">
                {numbered && (
                  <span aria-hidden className="hidden w-7 shrink-0 font-display text-sm font-bold tabular-nums text-muted group-data-[state=open]:text-accent-strong sm:block">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
                <span className="flex-1">{item.question}</span>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-lav-50 text-ink-deep transition-[transform,background-color] duration-300 group-hover:bg-lav-100 group-data-[state=open]:rotate-45 group-data-[state=open]:bg-accent">
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
