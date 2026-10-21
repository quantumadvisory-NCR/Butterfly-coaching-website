"use client";

import {
  ArrowUUpLeftIcon,
  ArrowUUpRightIcon,
  LinkBreakIcon,
  LinkSimpleIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  QuotesIcon,
  TextBIcon,
  TextHThreeIcon,
  TextHTwoIcon,
  TextItalicIcon,
} from "@phosphor-icons/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function Tool({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-lg text-navy transition-colors hover:bg-tint disabled:opacity-40",
        active && "bg-navy text-white hover:bg-navy",
      )}
    >
      {children}
    </button>
  );
}

/**
 * A small what-you-see-is-what-you-get editor. It can only produce headings,
 * paragraphs, lists, quotes, bold, italic and links, and the server sanitises
 * the HTML again before storing it.
 */
export function RichTextEditor({
  id,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (html: string) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [linking, setLinking] = useState(false);
  const [href, setHref] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        strike: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(invalid ? { "aria-invalid": "true" } : {}),
        class: "prose max-w-none min-h-32 px-3.5 py-3 outline-none",
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.isEmpty ? "" : instance.getHTML()),
  });

  // Keep the editor in step when the value is replaced from outside (e.g. restoring a revision).
  useEffect(() => {
    if (editor && !editor.isFocused && value !== (editor.isEmpty ? "" : editor.getHTML())) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return <div className="field-input min-h-44 animate-pulse bg-mist" aria-hidden />;

  const applyLink = () => {
    const url = href.trim();
    if (!url) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: /^(\/|#|https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}` }).run();
    setLinking(false);
    setHref("");
  };

  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-field)] border-[1.5px] bg-surface focus-within:border-primary focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_28%,transparent)]", invalid ? "border-danger" : "border-[#8a8f8d]")}>
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-b border-line bg-mist/60 p-1">
        <Tool label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <TextBIcon weight="bold" className="size-5" />
        </Tool>
        <Tool label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <TextItalicIcon weight="bold" className="size-5" />
        </Tool>
        <Tool label="Heading" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <TextHTwoIcon weight="bold" className="size-5" />
        </Tool>
        <Tool label="Subheading" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <TextHThreeIcon weight="bold" className="size-5" />
        </Tool>
        <Tool label="Bulleted list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <ListBulletsIcon weight="bold" className="size-5" />
        </Tool>
        <Tool label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListNumbersIcon weight="bold" className="size-5" />
        </Tool>
        <Tool label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <QuotesIcon weight="bold" className="size-5" />
        </Tool>
        <Tool
          label="Add or edit link"
          active={editor.isActive("link")}
          onClick={() => {
            setHref((editor.getAttributes("link").href as string | undefined) ?? "");
            setLinking((v) => !v);
          }}
        >
          <LinkSimpleIcon weight="bold" className="size-5" />
        </Tool>
        {editor.isActive("link") && (
          <Tool label="Remove link" onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}>
            <LinkBreakIcon weight="bold" className="size-5" />
          </Tool>
        )}
        <span className="mx-1 hidden h-6 w-px bg-line sm:block" />
        <Tool label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <ArrowUUpLeftIcon weight="bold" className="size-5" />
        </Tool>
        <Tool label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <ArrowUUpRightIcon weight="bold" className="size-5" />
        </Tool>
      </div>
      {linking && (
        <div className="flex flex-col gap-2 border-b border-line bg-tint p-2 sm:flex-row">
          <label htmlFor={`${id}-link`} className="sr-only">
            Link address
          </label>
          <input
            id={`${id}-link`}
            value={href}
            onChange={(event) => setHref(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
            }}
            placeholder="/contact-us/ or https://example.com"
            className="field-input min-h-10 flex-1 py-1.5"
            autoFocus
          />
          <button type="button" className="btn btn-dark btn-sm" onClick={applyLink}>
            Apply link
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
