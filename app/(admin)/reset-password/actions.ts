"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/ssr-server";
import type { ActionState } from "@/lib/admin/action-result";
import { password as passwordField } from "@/lib/admin/validate";

/**
 * 設定新密碼。
 *
 * 走到這一頁的人手上有一個從信裡點進來、已經被交換成 session 的 recovery
 * token —— 也就是說他此刻**是登入狀態**，只是這個 session 的用途只有改密碼。
 * 所以這裡用 `updateUser`，不需要舊密碼。
 *
 * ⚠️ 沒有 session 就不能改。Supabase 會擋（updateUser 會回錯），但我們先自己
 * 檢查一次，好回一句看得懂的中文 —— 最常見的情況是連結過期（一小時）或
 * 已經用過了。
 *
 * ⚠️ 規則與後台的兩個入口共用同一支 password()：三個地方若各寫一份，遲早
 * 出現「這裡可以、那裡不行」。真正的防線仍然在 Supabase 專案設定上。
 */
export async function updatePassword(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  const pw = passwordField(form, "password", "新密碼");
  const confirm = String(form.get("password_confirm") ?? "");

  if (pw.error) {
    return { ok: false, message: pw.error, fieldErrors: { password: pw.error } };
  }
  if (pw.value !== confirm) {
    return {
      ok: false,
      message: "兩次輸入的密碼不一樣",
      fieldErrors: { password_confirm: "與上面那一欄不一樣" },
    };
  }

  const supabase = await createClient();
  const { data: session } = await supabase.auth.getUser();
  if (!session.user) {
    return {
      ok: false,
      message: "這個重設連結已經失效（一小時有效，且只能用一次）。請回到「忘記密碼」重新寄一封。",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: pw.value });
  if (error) {
    console.error("[reset-password] updateUser failed:", error.message);
    return { ok: false, message: "密碼更新失敗，請稍後再試或重新申請一次重設連結。" };
  }

  // 改完直接進後台：他現在的 session 已經是完整的登入狀態，再叫他回去登入
  // 一次是多此一舉。能不能進後台仍然由 /admin 的 requireAdminOrRedirect 決定。
  redirect("/admin");
}
