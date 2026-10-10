"use client";

import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { Tabs } from "radix-ui";
import { useState, useTransition } from "react";
import { type MediaView, saveNavigationAction, saveSettingsAction } from "@/app/admin/actions/operations";
import type { Field } from "@/lib/blocks/fields";
import { DEFAULT_THEME, SETTINGS_GROUPS, type SettingsKey } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { FieldRenderer } from "./field-renderer";
import { MediaLibraryProvider } from "./media-picker";
import { Card } from "./ui";

type Status = { tone: "success" | "error"; text: string } | null;

function StatusLine({ status }: { status: Status }) {
  return (
    <p role="status" aria-live="polite" className={cn("flex min-h-6 items-center gap-1.5 text-sm font-semibold", status?.tone === "error" ? "text-danger" : "text-success")}>
      {status && (status.tone === "error" ? <WarningCircleIcon weight="fill" className="size-5 shrink-0" /> : <CheckCircleIcon weight="fill" className="size-5 shrink-0" />)}
      {status?.text}
    </p>
  );
}

/* ---- contrast helper for the theme tab ----------------------------------------- */

function luminance(hex: string) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}
function contrast(a: string, b: string) {
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return null;
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

function ContrastChecks({ theme }: { theme: Record<string, unknown> }) {
  const value = (key: string) => String(theme[key] ?? "");
  const checks = [
    { label: "Button text (navy on accent)", ratio: contrast(value("navy"), value("accent")) },
    { label: "Links (primary on white)", ratio: contrast(value("primary"), "#ffffff") },
    { label: "Body text on white", ratio: contrast(value("ink"), "#ffffff") },
    { label: "Body text on pale blue", ratio: contrast(value("ink"), value("sky")) },
    { label: "White text on navy", ratio: contrast("#ffffff", value("navy")) },
  ];
  return (
    <div className="rounded-xl bg-mist p-4">
      <p className="font-semibold text-navy">Readability check</p>
      <p className="mt-0.5 text-sm text-muted">Text needs a contrast ratio of at least 4.5 to 1 to be comfortably readable (WCAG AA).</p>
      <ul className="mt-3 grid gap-1.5 text-sm">
        {checks.map((check) => {
          const ok = check.ratio !== null && check.ratio >= 4.5;
          return (
            <li key={check.label} className="flex items-center justify-between gap-3">
              <span>{check.label}</span>
              <span className={cn("shrink-0 font-bold", ok ? "text-success" : "text-danger")}>
                {check.ratio ? `${check.ratio.toFixed(1)} to 1` : "Invalid colour"} {ok ? "Pass" : "Too low"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---- settings ------------------------------------------------------------------ */

function SettingsGroupForm({ groupKey, initial }: { groupKey: SettingsKey; initial: Record<string, unknown> }) {
  const group = SETTINGS_GROUPS[groupKey];
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>(null);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const result = await saveSettingsAction(groupKey, data);
      if (result.ok) {
        setErrors({});
        setStatus({ tone: "success", text: result.message ?? "Saved." });
        router.refresh();
      } else {
        setErrors(result.errors ?? {});
        setStatus({ tone: "error", text: result.message });
      }
    });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      noValidate
      className="grid gap-5"
    >
      <FieldRenderer fields={group.fields as readonly Field[]} value={data} onChange={setData} errors={errors} />
      {groupKey === "theme" && (
        <>
          <ContrastChecks theme={data} />
          <button type="button" className="btn btn-quiet btn-sm justify-self-start" onClick={() => setData({ ...DEFAULT_THEME })}>
            Reset to the BCA defaults
          </button>
        </>
      )}
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
          {pending ? "Saving" : "Save"}
        </button>
        <StatusLine status={status} />
      </div>
    </form>
  );
}

export function SettingsTabs({ values, media }: { values: Record<SettingsKey, Record<string, unknown>>; media: MediaView[] }) {
  const keys = Object.keys(SETTINGS_GROUPS) as SettingsKey[];
  return (
    <MediaLibraryProvider initial={media}>
      <Tabs.Root defaultValue={keys[0]} orientation="horizontal">
        <Tabs.List aria-label="Settings sections" className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {keys.map((key) => (
            <Tabs.Trigger
              key={key}
              value={key}
              className="min-h-10 shrink-0 whitespace-nowrap rounded-full border border-line bg-surface px-4 text-sm font-semibold text-navy hover:border-navy data-[state=active]:border-navy data-[state=active]:bg-navy data-[state=active]:text-white"
            >
              {SETTINGS_GROUPS[key].label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {keys.map((key) => (
          <Tabs.Content key={key} value={key} className="outline-none">
            <Card title={SETTINGS_GROUPS[key].label}>
              <SettingsGroupForm groupKey={key} initial={values[key]} />
            </Card>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </MediaLibraryProvider>
  );
}

/* ---- navigation ---------------------------------------------------------------- */

const linkFields = [
  { type: "text", name: "label", label: "Label", required: true, maxLength: 60 },
  { type: "url", name: "href", label: "Link", required: true, placeholder: "/about-us/" },
  { type: "text", name: "description", label: "Short description", help: "Shown under the label in dropdown menus.", maxLength: 120 },
  { type: "boolean", name: "isVisible", label: "Visible" },
  { type: "boolean", name: "openInNewTab", label: "Open in a new tab" },
] as const satisfies readonly Field[];

const MENUS = [
  { key: "header", label: "Header menu", help: "The main navigation. Give an item dropdown items to turn it into a dropdown.", nested: true },
  { key: "footer_programmes", label: "Footer: Programmes", help: "First column of links in the footer.", nested: false },
  { key: "footer_company", label: "Footer: Academy", help: "Second column of links in the footer.", nested: false },
  { key: "footer_legal", label: "Footer: Legal", help: "Small links beside the copyright line.", nested: false },
] as const;

function MenuForm({ menu, initial }: { menu: (typeof MENUS)[number]; initial: Record<string, unknown>[] }) {
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown>>({ items: initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>(null);
  const [pending, startTransition] = useTransition();
  const fields: readonly Field[] = [
    {
      type: "list",
      name: "items",
      label: "Menu items",
      itemLabel: "Item",
      titleField: "label",
      max: 12,
      fields: menu.nested
        ? [...linkFields, { type: "list", name: "children", label: "Dropdown items", itemLabel: "Dropdown item", titleField: "label", max: 8, fields: linkFields }]
        : linkFields,
    },
  ];
  return (
    <Card title={menu.label} description={menu.help}>
      <FieldRenderer fields={fields} value={data} onChange={setData} errors={errors} />
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button
          type="button"
          disabled={pending}
          className="btn btn-primary btn-sm"
          onClick={() =>
            startTransition(async () => {
              const result = await saveNavigationAction(menu.key, data);
              if (result.ok) {
                setErrors({});
                setStatus({ tone: "success", text: result.message ?? "Saved." });
                router.refresh();
              } else {
                setErrors(result.errors ?? {});
                setStatus({ tone: "error", text: result.message });
              }
            })
          }
        >
          {pending ? "Saving" : "Save menu"}
        </button>
        <StatusLine status={status} />
      </div>
    </Card>
  );
}

export function NavigationEditor({ menus }: { menus: Record<string, Record<string, unknown>[]> }) {
  return (
    <div className="grid gap-5">
      {MENUS.map((menu) => (
        <MenuForm key={menu.key} menu={menu} initial={menus[menu.key] ?? []} />
      ))}
    </div>
  );
}
