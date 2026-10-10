"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { Accordion as Primitive } from "radix-ui";

export type AccordionItem = { id: string; question: string; answerHtml: string };

/** Accessible FAQ accordion (WAI-ARIA accordion pattern via Radix). */
export function Accordion({ items }: { items: AccordionItem[] }) {
  return (
    <Primitive.Root type="multiple" className="border-t border-sky-line">
      {items.map((item) => (
        <Primitive.Item key={item.id} value={item.id} className="border-b border-sky-line">
          <Primitive.Header asChild>
            <h3 className="m-0 font-sans">
              <Primitive.Trigger className="group flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left text-[1.0625rem] font-semibold text-navy hover:text-primary">
                <span>{item.question}</span>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sky text-navy transition-transform duration-300 group-data-[state=open]:rotate-45 group-data-[state=open]:bg-accent">
                  <PlusIcon aria-hidden weight="bold" className="size-4" />
                </span>
              </Primitive.Trigger>
            </h3>
          </Primitive.Header>
          <Primitive.Content className="accordion-content overflow-hidden">
            <div className="prose pb-6 pr-10" dangerouslySetInnerHTML={{ __html: item.answerHtml }} />
          </Primitive.Content>
        </Primitive.Item>
      ))}
    </Primitive.Root>
  );
}
