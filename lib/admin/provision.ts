import "server-only";
import { createServerClient } from "@/lib/supabase/server";
import { requireManager } from "@/lib/admin/auth";

/**
 * 🔴 這是 `/admin` 底下**唯一**碰 service-role 金鑰的檔案。
 *
 * `lib/supabase/ssr-server.ts` 的檔頭寫著「Admin code must import this file.
 * Admin code must never import lib/supabase/server.ts」—— 理由是那兩支 client
 * 名字太像，誤用一次就是靜默提權：以為在跑 RLS，其實整個繞過去了。
 *
 * 這個檔是那條規則的唯一例外，因為建立／刪除 auth 帳號與重設密碼只能經由
 * GoTrue 的 Admin API，而它需要 service-role。
 *
 * （另一條路是直接 insert `auth.users`，但那要自己處理 bcrypt 雜湊、
 * `auth.identities` 那一列、以及 `aud`/`role`/`instance_id` 等 GoTrue 內部
 * 欄位。那些是平台的內部結構，不是公開契約 —— 今天會動，某次 Supabase 升級
 * 之後靜默壞掉。系辦每天在用的登入不能建在那上面。）
 *
 * 例外要成立，靠的是三件事同時做到：
 *
 *   1. **每一支匯出的函式第一行都是 `await requireManager()`**，不倚賴呼叫端
 *      記得檢查。React 的 `cache()` 讓同一個請求內的重複呼叫不花成本。
 *   2. **只匯出三個具體動作**，不匯出 client 本身 —— 否則這個檔就變成一個
 *      通用的提權入口，任何人 import 進去就能對整個資料庫為所欲為。
 *   3. **不碰 `admin_users`**。白名單的讀寫走一般的 session client 與
 *      `is_manager()` policy（見 app/(admin)/admin/users/actions.ts），
 *      所以資料庫那一層仍然在管事。
 *
 * ⚠️ 修改這個檔之前先想清楚：你是不是在把第 2 點打開。
 */

export type ProvisionResult =
  | { ok: true; userId: string }
  | { ok: false; message: string };

/** GoTrue 的錯誤訊息是英文的，轉成系辦看得懂的話。 */
function describe(error: { message?: string; status?: number }): string {
  const message = error.message ?? "";
  console.error("[admin/provision] GoTrue 失敗:", error.status, message);

  if (/already been registered|already exists|duplicate/i.test(message)) {
    return "這個電子信箱已經有帳號了。若他還不是後台人員，請改用「加入現有帳號」。";
  }
  if (/password/i.test(message)) {
    // 這個專案沒有設最短密碼長度（admin 五碼建得起來就是證據），所以會走到
    // 這裡通常是別的原因；原文附上去比較好回報。
    return `密碼不符合規則：${message}`;
  }
  if (/email/i.test(message)) {
    return `電子信箱有問題：${message}`;
  }
  return `帳號操作失敗（${error.status ?? "unknown"}），請截圖回報`;
}

/**
 * 建立一個 auth 帳號。
 *
 * ⚠️ 這一支**只建帳號，不加白名單**。加白名單是呼叫端的事，走一般 session
 * client —— 那樣資料庫的 `is_manager()` policy 才會實際發揮作用。兩件事分開，
 * service-role 的接觸面才停在「建帳號」這一步。
 *
 * `email_confirm: true`：系辦是當面或用電話把密碼給對方的，沒有寄信服務可以
 * 送確認信（這個站根本沒接 email）。不預先確認的話帳號建了也登不進去。
 */
export async function createAuthUser(
  email: string,
  password: string
): Promise<ProvisionResult> {
  await requireManager();

  const supabase = createServerClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) return { ok: false, message: describe(error) };
  if (!data.user?.id) {
    return { ok: false, message: "帳號建立後沒有拿到編號，請截圖回報" };
  }
  return { ok: true, userId: data.user.id };
}

/** 重設某個人的密碼。帳號與白名單都不動。 */
export async function setUserPassword(
  userId: string,
  password: string
): Promise<ProvisionResult> {
  await requireManager();

  const supabase = createServerClient();
  const { error } = await supabase.auth.admin.updateUserById(userId, { password });
  if (error) return { ok: false, message: describe(error) };
  return { ok: true, userId };
}

/**
 * 刪除 auth 帳號。
 *
 * ⚠️ 不可逆，而且 `admin_users.user_id` 是 `on delete cascade`，白名單那一列
 * 會跟著消失 —— 所以呼叫端不需要（也不該）另外去刪白名單。
 *
 * ⚠️ 若這是最後一個管理員，資料庫的 `admin_users_keep_manager` trigger 會擋下
 * cascade，於是整個刪除失敗並回一個 LAST_MANAGER 錯誤。那是刻意的：沒有管理員
 * 的後台沒有人救得回來。
 */
export async function deleteAuthUser(userId: string): Promise<ProvisionResult> {
  await requireManager();

  const supabase = createServerClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    if (/LAST_MANAGER/i.test(error.message ?? "")) {
      return {
        ok: false,
        message: "系統至少要保留一位管理員，無法刪除最後一位。請先指定另一位管理員。",
      };
    }
    return { ok: false, message: describe(error) };
  }
  return { ok: true, userId };
}
