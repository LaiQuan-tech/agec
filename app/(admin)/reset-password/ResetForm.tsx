"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { updatePassword } from "./actions";
import { idleState } from "@/lib/admin/action-result";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/admin/ui/Button";
import { Field } from "@/components/admin/ui/Field";
import { Input } from "@/components/admin/ui/Input";
import { PASSWORD_MIN_LENGTH, PASSWORD_RULE_HINT } from "@/lib/admin/validate";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending} className="w-full">
      {pending ? "更新中…" : "設定新密碼"}
    </Button>
  );
}

/**
 * 🔴 為什麼要有這個 client 元件，而不是純伺服器表單
 *
 * Supabase 的重設連結把 token 放在**網址的 hash**（`#access_token=…`）或
 * `?code=…`。hash 從來不會送到伺服器，所以伺服器完全看不到它 —— 必須在瀏覽器
 * 裡讓 supabase-js 把它換成 session（寫進 cookie），Server Action 才拿得到
 * 使用者。`detectSessionInUrl` 預設是開的，所以只要在客戶端載入一次 client
 * 就會自動處理；這個 effect 等它完成，然後才把表單放出來。
 *
 * 沒有這一步的話，使用者會看到表單、填完、然後被告知「連結已失效」——
 * 而連結其實是好的。
 */
export function ResetForm() {
  const [state, formAction] = useActionState(updatePassword, idleState);
  const [ready, setReady] = useState<null | boolean>(null);

  useEffect(() => {
    const supabase = createClient();
    // getSession() 會等 detectSessionInUrl 把 hash / code 處理完。
    supabase.auth
      .getSession()
      .then(({ data }) => setReady(Boolean(data.session)))
      .catch(() => setReady(false));
  }, []);

  if (ready === null) {
    return (
      <p className="text-center text-[13px]" style={{ color: "var(--muted)" }}>
        驗證連結中…
      </p>
    );
  }

  if (!ready) {
    return (
      <p
        role="alert"
        className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700"
      >
        這個重設連結無效或已經過期（一小時有效，且只能用一次）。請回到「忘記密碼」重新寄一封。
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.message && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700"
        >
          {state.message}
        </p>
      )}

      <Field
        htmlFor="password"
        label="新密碼"
        required
        error={state.fieldErrors?.password}
        hint={PASSWORD_RULE_HINT}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          autoFocus
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
      </Field>

      <Field
        htmlFor="password_confirm"
        label="再輸入一次"
        required
        error={state.fieldErrors?.password_confirm}
      >
        <Input
          id="password_confirm"
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          aria-invalid={Boolean(state.fieldErrors?.password_confirm)}
        />
      </Field>

      <SubmitButton />
    </form>
  );
}
