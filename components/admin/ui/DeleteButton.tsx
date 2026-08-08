"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/admin/ui/Button";

function Confirm({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" size="sm" disabled={pending}>
      {pending ? "刪除中…" : label}
    </Button>
  );
}

/**
 * Delete with a confirmation step. Uses the native <dialog> element — it gives
 * focus trapping, Esc-to-close, and the top layer for free, which a hand-rolled
 * modal would have to reimplement.
 *
 * Rendered as a form posting to a Server Action rather than a link, so it can't
 * be triggered by a prefetch or a crawler.
 */
export function DeleteButton({
  action,
  id,
  itemLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: number;
  /** Shown in the confirmation text so the staff can see what they're deleting. */
  itemLabel: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-red-600 hover:bg-red-50"
        onClick={() => {
          setOpen(true);
          dialogRef.current?.showModal();
        }}
      >
        刪除
      </Button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="m-auto max-w-sm rounded-lg border p-0 backdrop:bg-black/40"
        style={{ borderColor: "var(--hairline)" }}
      >
        {open && (
          <div className="p-5">
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
              確定要刪除嗎？
            </h2>
            <p className="mt-2 text-[13px]" style={{ color: "var(--muted)" }}>
              「{itemLabel}」將被永久刪除，這個動作無法復原。
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => dialogRef.current?.close()}
              >
                取消
              </Button>
              <form action={action}>
                <input type="hidden" name="id" value={id} />
                <Confirm label="確定刪除" />
              </form>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
