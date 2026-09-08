"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/ssr-server";
import type { ActionState } from "@/lib/admin/action-result";

/**
 * 寄出重設密碼的信。
 *
 * ## 🔴 不論信箱存不存在，回的訊息都一樣
 *
 * 這是刻意的，與 /login 「帳號或密碼錯誤」同一個理由：如果「查無此信箱」和
 * 「信已寄出」講得不一樣，任何人都可以拿這一頁逐一試出誰有後台帳號。
 * Supabase 的 resetPasswordForEmail 本身對不存在的信箱也是回成功。
 *
 * ## 為什麼不先檢查是不是管理者
 *
 * 同上：查 admin_users 再決定要不要寄，等於把白名單變成可查詢的。而且沒有
 * 風險 —— 重設密碼只還原他本來就有的登入能力，能不能進後台是登入之後由
 * is_admin() 決定的（見 login/actions.ts）。
 *
 * ## redirectTo
 *
 * 從請求的 host 組出來，而不是寫死：本機開發與正式站是不同的 origin，寫死
 * 會讓其中一邊永遠收到指向另一邊的連結。
 *
 * ⚠️ 這個網址必須在 Supabase 的 Auth → URL Configuration 允許清單裡，否則
 * Supabase 會忽略它、改用 Site URL。2026-09 已設定：正式站加上兩個本機埠。
 */
export async function requestPasswordReset(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  const email = String(form.get("email") ?? "").trim();
  if (!email) {
    return { ok: false, message: "請輸入電子郵件", fieldErrors: { email: "請輸入電子郵件" } };
  }

  const h = await headers();
  // x-forwarded-proto 在 Vercel 後面才是對的；本機沒有這個標頭，退回 http。
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host");
  const origin = host ? `${proto}://${host}` : "https://agec-theta.vercel.app";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    // 寄信本身失敗（多半是 Supabase 內建寄信的頻率上限：每小時 2 封）。
    // 這一種要照實說，否則使用者會一直等一封永遠不會到的信。
    console.error("[forgot-password] resetPasswordForEmail failed:", error.message);
    return {
      ok: false,
      message: "寄信失敗，請稍後再試；若持續發生請聯絡系辦或開發者。",
    };
  }

  return {
    ok: true,
    message: "若這個信箱有後台帳號，重設密碼的信已經寄出，請到信箱收信（也請看一下垃圾郵件）。連結一小時內有效。",
  };
}
