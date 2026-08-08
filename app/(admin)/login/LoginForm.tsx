"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "./actions";
import { idleState } from "@/lib/admin/action-result";
import { Button } from "@/components/admin/ui/Button";
import { Field } from "@/components/admin/ui/Field";
import { Input } from "@/components/admin/ui/Input";

function SubmitButton() {
  // useFormStatus must be read from a child of the <form>, not the form itself.
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending} className="w-full">
      {pending ? "登入中…" : "登入"}
    </Button>
  );
}

export function LoginForm({ next, notAdmin }: { next: string; notAdmin: boolean }) {
  const [state, formAction] = useActionState(loginAction, idleState);

  const banner = state.message ?? (notAdmin ? "這個帳號不在管理者名單內，請聯絡開發者" : null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {banner && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700"
        >
          {banner}
        </p>
      )}

      <Field htmlFor="email" label="電子郵件" required error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
        />
      </Field>

      <Field htmlFor="password" label="密碼" required error={state.fieldErrors?.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
        />
      </Field>

      <SubmitButton />
    </form>
  );
}
