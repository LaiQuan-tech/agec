"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/ssr-server";
import type { ActionState } from "@/lib/admin/action-result";

/**
 * Only same-origin admin paths are accepted as a post-login destination, so a
 * crafted `?next=https://evil.example` can't turn the login page into an open
 * redirect.
 */
function safeNext(raw: FormDataEntryValue | null): string {
  const value = typeof raw === "string" ? raw : "";
  if (value.startsWith("/admin") && !value.startsWith("//")) return value;
  return "/admin";
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  const fieldErrors: Record<string, string> = {};
  if (!email) fieldErrors.email = "請輸入電子郵件";
  if (!password) fieldErrors.password = "請輸入密碼";
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "請填寫帳號與密碼", fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Supabase returns "Invalid login credentials" for both a wrong password
    // and an unknown address, which is the behaviour we want — telling the
    // difference would let someone enumerate valid accounts.
    console.error("[login] sign-in failed:", error.message);
    return { ok: false, message: "帳號或密碼錯誤" };
  }

  // Signing in is not the same as being allowed in. Sign-ups are open on this
  // Supabase project, so a valid session proves nothing about authorization —
  // membership of admin_users does.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return {
      ok: false,
      message: "這個帳號不在管理者名單內，請聯絡開發者",
    };
  }

  // redirect() throws a control-flow exception, so it must stay outside any
  // try/catch — a catch block would swallow it and the user would sit on the
  // login page with no feedback.
  redirect(next);
}
