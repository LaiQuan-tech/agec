"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { idleState, type ActionState } from "@/lib/admin/action-result";
import { Button } from "@/components/admin/ui/Button";

type ServerAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function Actions({ submitLabel, secondary }: { submitLabel: string; secondary?: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "儲存中…" : submitLabel}
      </Button>
      {secondary}
    </div>
  );
}

/**
 * Wraps every admin form so the result banner, the pending state, and the
 * unsaved-changes guard behave the same everywhere.
 *
 * Deliberately does not redirect on success: on failure the office staff must
 * keep whatever they typed, and having one path for both keeps the "did it
 * save?" answer visible on the page they're already looking at.
 *
 * `children` receives the action state so individual fields can render their
 * own errors from state.fieldErrors.
 */
export function FormShell({
  action,
  submitLabel = "儲存",
  secondary,
  children,
}: {
  action: ServerAction;
  submitLabel?: string;
  secondary?: ReactNode;
  children: (state: ActionState) => ReactNode;
}) {
  const [state, formAction] = useActionState(action, idleState);
  const formRef = useRef<HTMLFormElement>(null);
  const dirtyRef = useRef(false);

  // Warn before navigating away with unsaved edits. Cleared on a successful
  // save so the warning doesn't fire on the way out of a saved form.
  useEffect(() => {
    if (state.ok) dirtyRef.current = false;
  }, [state.ok]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return (
    <form
      ref={formRef}
      action={formAction}
      onChange={() => {
        dirtyRef.current = true;
      }}
      className="flex max-w-2xl flex-col gap-5"
    >
      {state.message && (
        <p
          role="status"
          className={
            state.ok
              ? "rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-800"
              : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700"
          }
        >
          {state.message}
        </p>
      )}

      {children(state)}

      <Actions submitLabel={submitLabel} secondary={secondary} />
    </form>
  );
}
