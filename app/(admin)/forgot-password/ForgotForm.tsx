"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordReset } from "./actions";
import { idleState } from "@/lib/admin/action-result";
import { Button } from "@/components/admin/ui/Button";
import { Field } from "@/components/admin/ui/Field";
import { Input } from "@/components/admin/ui/Input";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending} className="w-full">
      {pending ? "寄送中…" : "寄送重設連結"}
    </Button>
  );
}

export function ForgotForm() {
  const [state, formAction] = useActionState(requestPasswordReset, idleState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
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

      {/* 成功之後把表單收起來：留著一顆可以再按的按鈕，只會讓人在等信的時候
          反覆按，然後撞上 Supabase 每小時 2 封的寄信上限。 */}
      {!state.ok && (
        <>
          <Field htmlFor="email" label="電子郵件" required error={state.fieldErrors?.email}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              autoFocus
              aria-invalid={Boolean(state.fieldErrors?.email)}
            />
          </Field>
          <SubmitButton />
        </>
      )}
    </form>
  );
}
