"use client";

import { useRouter } from "next/navigation";
import { deleteSubscriberAction } from "@/app/admin/actions/operations";
import { ConfirmButton } from "./confirm-button";

/** Small confirm-then-delete button for table rows. */
export function RowAction({ kind, id, label }: { kind: "subscriber"; id: string; label: string }) {
  const router = useRouter();
  const action = kind === "subscriber" ? () => deleteSubscriberAction(id) : () => Promise.resolve({ ok: false });
  return (
    <ConfirmButton
      label="Remove"
      title="Remove this subscriber?"
      description={<>{label}. They will no longer be on your newsletter list.</>}
      confirmLabel="Remove"
      action={action}
      onDone={() => router.refresh()}
    />
  );
}
