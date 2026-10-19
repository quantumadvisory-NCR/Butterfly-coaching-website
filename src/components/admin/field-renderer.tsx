"use client";

import { ArrowDownIcon, ArrowUpIcon, CaretDownIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";
import { type Field, type LinkValue, type Option, type ReferenceTarget, defaultsFor } from "@/lib/blocks/fields";
import { cn } from "@/lib/utils";
import { MediaPicker } from "./media-picker";
import { RichTextEditor } from "./rich-text-editor";

export type RefOptions = Partial<Record<ReferenceTarget, Option[]>>;
type Data = Record<string, unknown>;

type Props = {
  fields: readonly Field[];
  value: Data;
  onChange: (next: Data) => void;
  /** Validation messages keyed by dotted path, e.g. "items.2.title". */
  errors?: Record<string, string>;
  /** Path of this group within the whole form, used to look up errors. */
  path?: string;
  refOptions?: RefOptions;
};

/** Renders an editing form from a field declaration. Used by every admin form and every page block. */
export function FieldRenderer({ fields, value, onChange, errors = {}, path = "", refOptions = {} }: Props) {
  const uid = useId();
  return (
    <div className="grid gap-5">
      {fields.map((field) => {
        const fieldPath = path ? `${path}.${field.name}` : field.name;
        return (
          <FieldControl
            key={field.name}
            id={`${uid}-${field.name}`}
            field={field}
            value={value[field.name]}
            onChange={(next) => onChange({ ...value, [field.name]: next })}
            error={errors[fieldPath]}
            errors={errors}
            path={fieldPath}
            refOptions={refOptions}
          />
        );
      })}
    </div>
  );
}

type ControlProps = {
  id: string;
  field: Field;
  value: unknown;
  onChange: (next: unknown) => void;
  error?: string;
  errors: Record<string, string>;
  path: string;
  refOptions: RefOptions;
};

function FieldControl({ id, field, value, onChange, error, errors, path, refOptions }: ControlProps) {
  const describedBy = [error && `${id}-error`, field.help && `${id}-help`].filter(Boolean).join(" ") || undefined;
  const invalid = Boolean(error);
  const text = typeof value === "string" ? value : "";

  const footer = (
    <>
      {field.help && (
        <p id={`${id}-help`} className="field-help">
          {field.help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
  const label = (
    <label htmlFor={id} className="field-label">
      {field.label}
      {field.required && (
        <span className="text-danger" aria-hidden>
          {" "}
          *
        </span>
      )}
      {field.required && <span className="sr-only"> (required)</span>}
    </label>
  );

  switch (field.type) {
    case "text":
    case "url":
    case "date":
      return (
        <div>
          {label}
          <input
            id={id}
            type={field.type === "date" ? "date" : "text"}
            inputMode={field.type === "url" ? "url" : undefined}
            value={text}
            maxLength={field.type === "text" ? field.maxLength : undefined}
            placeholder={field.type !== "date" ? field.placeholder : undefined}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className="field-input"
          />
          {footer}
        </div>
      );

    case "textarea":
      return (
        <div>
          {label}
          <textarea
            id={id}
            value={text}
            rows={field.rows ?? 4}
            maxLength={field.maxLength}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className="field-input"
            style={{ minHeight: `${(field.rows ?? 4) * 1.6 + 1.5}rem` }}
          />
          {field.maxLength && text.length > field.maxLength * 0.8 && (
            <p className="mt-1 text-right text-xs text-muted">
              {text.length} / {field.maxLength}
            </p>
          )}
          {footer}
        </div>
      );

    case "richtext":
      return (
        <div>
          {label}
          <RichTextEditor id={id} value={text} onChange={onChange} invalid={invalid} describedBy={describedBy} />
          {footer}
        </div>
      );

    case "number":
      return (
        <div className="max-w-xs">
          {label}
          <input
            id={id}
            type="number"
            inputMode="decimal"
            value={value === null || value === undefined ? "" : String(value)}
            min={field.min}
            max={field.max}
            step="any"
            onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className="field-input"
          />
          {footer}
        </div>
      );

    case "boolean":
      return (
        <div>
          <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3">
            <input
              id={id}
              type="checkbox"
              checked={value === true}
              onChange={(event) => onChange(event.target.checked)}
              aria-describedby={describedBy}
              className="size-5 shrink-0 rounded border-2 border-[#8a8f8d] accent-[var(--color-primary)]"
            />
            <span className="font-semibold text-navy">{field.label}</span>
          </label>
          {footer}
        </div>
      );

    case "select":
      return (
        <div>
          {label}
          <select id={id} value={text} onChange={(event) => onChange(event.target.value)} aria-invalid={invalid} aria-describedby={describedBy} className="field-input">
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {footer}
        </div>
      );

    case "color":
      return (
        <div>
          {label}
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(text) ? text : "#000000"}
              onChange={(event) => onChange(event.target.value)}
              aria-label={`${field.label} colour picker`}
              className="size-12 shrink-0 cursor-pointer rounded-lg border border-line bg-surface p-1"
            />
            <input
              id={id}
              type="text"
              value={text}
              maxLength={7}
              onChange={(event) => onChange(event.target.value)}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className="field-input max-w-40 font-mono"
            />
          </div>
          {footer}
        </div>
      );

    case "reference": {
      const options = refOptions[field.to] ?? [];
      return (
        <div>
          {label}
          <select id={id} value={text} onChange={(event) => onChange(event.target.value)} aria-invalid={invalid} aria-describedby={describedBy} className="field-input">
            <option value="">None</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {footer}
        </div>
      );
    }

    case "references": {
      const options = refOptions[field.to] ?? [];
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <fieldset aria-describedby={describedBy}>
          <legend className="field-label">{field.label}</legend>
          {options.length === 0 ? (
            <p className="text-sm text-muted">Nothing to choose from yet.</p>
          ) : (
            <div className="grid gap-x-6 sm:grid-cols-2">
              {options.map((option) => (
                <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={(event) => onChange(event.target.checked ? [...selected, option.value] : selected.filter((v) => v !== option.value))}
                    className="size-5 shrink-0 rounded border-2 border-[#8a8f8d] accent-[var(--color-primary)]"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          )}
          {footer}
        </fieldset>
      );
    }

    case "image":
    case "file":
      return (
        <div>
          {label}
          <MediaPicker id={id} value={typeof value === "string" ? value : null} onChange={onChange} kind={field.type} invalid={invalid} />
          {footer}
        </div>
      );

    case "link": {
      const link = (value && typeof value === "object" ? value : { label: "", href: "" }) as LinkValue;
      const hrefError = errors[`${path}.href`];
      const labelError = errors[`${path}.label`];
      return (
        <fieldset className="rounded-[var(--radius-field)] border border-line p-3">
          <legend className="px-1 text-[0.9375rem] font-semibold text-navy">{field.label}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`${id}-label`} className="mb-1 block text-sm text-muted">
                Button text
              </label>
              <input
                id={`${id}-label`}
                type="text"
                value={link.label ?? ""}
                maxLength={80}
                onChange={(event) => onChange({ ...link, label: event.target.value })}
                aria-invalid={Boolean(labelError)}
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor={`${id}-href`} className="mb-1 block text-sm text-muted">
                Goes to
              </label>
              <input
                id={`${id}-href`}
                type="text"
                inputMode="url"
                value={link.href ?? ""}
                placeholder="/contact-us/"
                onChange={(event) => onChange({ ...link, href: event.target.value })}
                aria-invalid={Boolean(hrefError)}
                aria-describedby={`${id}-href-help`}
                className="field-input"
              />
            </div>
          </div>
          <p id={`${id}-href-help`} className="field-help">
            {field.help ?? 'A page path such as /contact-us/, a full web address, or a shortcut: "booking", "whatsapp" or "phone". Leave both empty to hide the button.'}
          </p>
          {(hrefError || labelError || error) && (
            <p className="field-error" role="alert">
              {hrefError ?? labelError ?? error}
            </p>
          )}
        </fieldset>
      );
    }

    case "stringList": {
      const items = Array.isArray(value) ? (value as string[]) : [];
      const set = (next: string[]) => onChange(next);
      return (
        <fieldset aria-describedby={describedBy}>
          <legend className="field-label">{field.label}</legend>
          <ul className="grid gap-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <label htmlFor={`${id}-${i}`} className="sr-only">
                  {field.itemLabel} {i + 1}
                </label>
                <input
                  id={`${id}-${i}`}
                  type="text"
                  value={item}
                  onChange={(event) => set(items.map((v, j) => (j === i ? event.target.value : v)))}
                  className="field-input"
                />
                <RowButton label={`Move ${field.itemLabel.toLowerCase()} ${i + 1} up`} disabled={i === 0} onClick={() => set(move(items, i, i - 1))}>
                  <ArrowUpIcon weight="bold" className="size-4" />
                </RowButton>
                <RowButton label={`Remove ${field.itemLabel.toLowerCase()} ${i + 1}`} onClick={() => set(items.filter((_, j) => j !== i))}>
                  <TrashIcon weight="bold" className="size-4" />
                </RowButton>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-quiet btn-sm mt-2" onClick={() => set([...items, ""])}>
            <PlusIcon weight="bold" className="size-4" />
            Add {field.itemLabel.toLowerCase()}
          </button>
          {footer}
        </fieldset>
      );
    }

    case "list":
      return <ListControl id={id} field={field} value={value} onChange={onChange} error={error} errors={errors} path={path} refOptions={refOptions} />;
  }
}

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

function RowButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-11 shrink-0 place-items-center rounded-lg border border-line text-navy hover:border-navy disabled:opacity-35"
    >
      {children}
    </button>
  );
}

/** Repeatable group of fields with add, remove, reorder and collapse. */
function ListControl({ id, field, value, onChange, error, errors, path, refOptions }: ControlProps & { field: Extract<Field, { type: "list" }> }) {
  const items = Array.isArray(value) ? (value as Data[]) : [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const atMax = field.max !== undefined && items.length >= field.max;
  const hasErrorIn = (i: number) => Object.keys(errors).some((key) => key.startsWith(`${path}.${i}.`));

  return (
    <fieldset>
      <legend className="field-label">{field.label}</legend>
      {field.help && <p className="field-help mb-2 mt-0">{field.help}</p>}
      {items.length === 0 && <p className="mb-2 text-sm text-muted">None yet.</p>}
      <ol className="grid gap-2">
        {items.map((item, i) => {
          const open = openIndex === i;
          const title = (field.titleField && typeof item[field.titleField] === "string" && (item[field.titleField] as string)) || `${field.itemLabel} ${i + 1}`;
          const panelId = `${id}-item-${i}`;
          return (
            <li key={i} className={cn("rounded-xl border bg-surface", hasErrorIn(i) ? "border-danger" : "border-line")}>
              <div className="flex items-center gap-1 p-1.5">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-left hover:bg-tint"
                >
                  <CaretDownIcon weight="bold" className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
                  <span className="truncate font-semibold text-navy">{title}</span>
                  {hasErrorIn(i) && <span className="shrink-0 text-xs font-bold text-danger">Needs attention</span>}
                </button>
                <RowButton label={`Move ${title} up`} disabled={i === 0} onClick={() => onChange(move(items, i, i - 1))}>
                  <ArrowUpIcon weight="bold" className="size-4" />
                </RowButton>
                <RowButton label={`Move ${title} down`} disabled={i === items.length - 1} onClick={() => onChange(move(items, i, i + 1))}>
                  <ArrowDownIcon weight="bold" className="size-4" />
                </RowButton>
                <RowButton
                  label={`Remove ${title}`}
                  onClick={() => {
                    onChange(items.filter((_, j) => j !== i));
                    setOpenIndex(null);
                  }}
                >
                  <TrashIcon weight="bold" className="size-4" />
                </RowButton>
              </div>
              {open && (
                <div id={panelId} className="border-t border-line p-3 sm:p-4">
                  <FieldRenderer
                    fields={field.fields}
                    value={item}
                    onChange={(next) => onChange(items.map((v, j) => (j === i ? next : v)))}
                    errors={errors}
                    path={`${path}.${i}`}
                    refOptions={refOptions}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        className="btn btn-quiet btn-sm mt-2"
        disabled={atMax}
        onClick={() => {
          onChange([...items, defaultsFor(field.fields)]);
          setOpenIndex(items.length);
        }}
      >
        <PlusIcon weight="bold" className="size-4" />
        Add {field.itemLabel.toLowerCase()}
      </button>
      {atMax && <p className="field-help">Maximum of {field.max} reached.</p>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
