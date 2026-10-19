"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addEnquiryNoteAction, deleteEnquiryAction, updateEnquiryStatusAction } from "@/app/admin/actions/operations";
import { ConfirmButton } from "./confirm-button";
import { Card } from "./ui";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "closed", label: "Closed" },
  { value: "spam", label: "Spam" },
];

type Note = { id: string; body: string; createdAt: string; author: string };

export function EnquiryControls({ id, status, notes, canDelete }: { id: string; status: string; notes: Note[]; canDelete: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const changeStatus = (next: string) => {
    setCurrent(next);
    startTransition(async () => {
      const result = await updateEnquiryStatusAction(id, next);
      setMessage({ ok: result.ok, text: result.message ?? "" });
    });
  };

  const addNote = () =>
    startTransition(async () => {
      const result = await addEnquiryNoteAction(id, note);
      setMessage({ ok: result.ok, text: result.message ?? "" });
      if (result.ok) setNote("");
    });

  return (
    <>
      <Card title="Status">
        <label htmlFor="enquiry-status" className="sr-only">
          Status
        </label>
        <select id="enquiry-status" value={current} disabled={pending} onChange={(event) => changeStatus(event.target.value)} className="field-input">
          {STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p role="status" aria-live="polite" className={`mt-2 min-h-5 text-sm font-semibold ${message?.ok === false ? "text-danger" : "text-success"}`}>
          {message?.text}
        </p>
        {canDelete && (
          <div className="mt-2 border-t border-line pt-4">
            <ConfirmButton
              label="Delete enquiry"
              title="Delete this enquiry?"
              description="The enquiry and its notes will be removed permanently. Use this for data-deletion requests."
              confirmLabel="Delete permanently"
              action={() => deleteEnquiryAction(id)}
              onDone={() => {
                router.push("/admin/enquiries/");
              }}
            />
          </div>
        )}
      </Card>

      <Card title="Internal notes" description="Only your team can see these.">
        {notes.length === 0 ? (
          <p className="text-[0.9375rem] text-muted">No notes yet.</p>
        ) : (
          <ol className="grid gap-3">
            {notes.map((entry) => (
              <li key={entry.id} className="rounded-xl bg-mist p-3">
                <p className="whitespace-pre-wrap text-[0.9375rem] [overflow-wrap:anywhere]">{entry.body}</p>
                <p className="mt-1.5 text-xs text-muted">
                  {entry.author}, {entry.createdAt}
                </p>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-4">
          <label htmlFor="enquiry-note" className="field-label">
            Add a note
          </label>
          <textarea id="enquiry-note" value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={4000} className="field-input" style={{ minHeight: "5.5rem" }} />
          <button type="button" className="btn btn-blue btn-sm mt-3" disabled={pending || !note.trim()} onClick={addNote}>
            {pending ? "Saving" : "Add note"}
          </button>
        </div>
      </Card>
    </>
  );
}
