"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/admin/auth";
import {
  toChineseError,
  toAuthErrorState,
  type ActionState,
} from "@/lib/admin/action-result";
import { collect, oneOf, text } from "@/lib/admin/validate";
import {
  createAuthUser,
  deleteAuthUser,
  setUserPassword,
} from "@/lib/admin/provision";
import { ADMIN_ROLES, toAdminRole } from "./constants";

/*
 * ⚠️ 這個檔只能 export async 函式 —— `"use server"` 在檔案頂端時，Next 會把
 * 每一個 export 都當成 Server Function。常數與型別放在 ./constants.ts。
 * （系友報名那支 action 就是踩了這個才 500，而 build 完全不會擋。）
 *
 * ⚠️ 每一支都以 requireManager() 開頭。Server Action 是對頁面路由的 POST，
 * 頁面層的 requireManagerOrRedirect() 擋不住直接打過來的人。
 */

/** 白名單只有這幾欄可以由表單決定。 */
const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function parseEmail(form: FormData): { value: string | null; error?: string } {
  const raw = String(form.get("email") ?? "").trim().toLowerCase();
  if (!raw) return { value: null, error: "請填寫電子信箱" };
  if (!EMAIL_SHAPE.test(raw) || raw.length > 254) {
    return { value: null, error: "電子信箱格式看起來不正確" };
  }
  return { value: raw };
}

function requireUserId(form: FormData): string {
  const id = String(form.get("user_id") ?? "").trim();
  if (!id) throw new Error("MISSING_USER_ID");
  return id;
}

function refresh() {
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

/**
 * 新增一位後台人員。
 *
 * 兩步：GoTrue 建 auth 帳號（service-role）→ 寫白名單（一般 session client）。
 *
 * ⚠️ 分兩步而不是把白名單也交給 service-role，是刻意的：白名單那一步走
 * session client，資料庫的 `is_manager()` policy 才會實際發揮作用。若兩步都用
 * service-role，policy 就永遠不會被執行到，等於只剩應用層一道防線。
 *
 * ⚠️ 第二步失敗時要把剛建好的 auth 帳號刪掉。否則會留下一個「登得進去、但不在
 * 白名單」的孤兒帳號 —— 他會卡在 /login?error=not_admin，而管理員在人員清單上
 * 看不到他，根本不知道有這個帳號存在。
 */
export async function createUser(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  try {
    const { supabase, userId: actorId } = await requireManager();

    const email = parseEmail(form);
    const password = String(form.get("password") ?? "");
    const role = oneOf(form, "role", "層級", ADMIN_ROLES, { required: true });
    const note = text(form, "note", "備註", { max: 100 });

    const fieldErrors = collect({
      email: email.error,
      // 只驗非空。這個 Supabase 專案沒有設最短長度（admin 五碼建得起來就是
      // 證據），在前端加一個資料庫不會擋的規則只會讓人以為有保護。
      password: password.length === 0 ? "請填寫密碼" : undefined,
      role: role.error,
      note: note.error,
    });
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    const created = await createAuthUser(email.value!, password);
    if (!created.ok) return { ok: false, message: created.message };

    const { error } = await supabase.from("admin_users").insert({
      user_id: created.userId,
      email: email.value,
      role: role.value,
      note: note.value,
      created_by: actorId,
    });

    if (error) {
      // 補償：把剛建的 auth 帳號收回去，不要留下孤兒。
      const undo = await deleteAuthUser(created.userId);
      const suffix = undo.ok
        ? ""
        : "（⚠️ 而且剛建立的帳號沒有清乾淨，請聯絡開發者）";
      return { ok: false, message: toChineseError(error) + suffix };
    }

    refresh();
    return { ok: true, message: `已建立 ${email.value}，請把密碼交給對方` };
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }
}

/**
 * 加入一個已經存在的 auth 帳號。
 *
 * 用得到的情境：對方曾經自己註冊過（這個 Supabase 專案的 email 註冊是開著的），
 * 或是被移除權限之後要加回來 —— 這兩種情況下 GoTrue 已經有那個帳號，再建一次
 * 會撞「已經註冊過」。
 */
export async function addExistingUser(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  try {
    const { supabase, userId: actorId } = await requireManager();

    const userId = String(form.get("existing_user_id") ?? "").trim();
    const email = parseEmail(form);
    const role = oneOf(form, "role", "層級", ADMIN_ROLES, { required: true });
    const note = text(form, "note", "備註", { max: 100 });

    const fieldErrors = collect({
      existing_user_id: userId ? undefined : "請填寫帳號編號（UUID）",
      email: email.error,
      role: role.error,
      note: note.error,
    });
    if (fieldErrors) return { ok: false, message: "請修正下列欄位", fieldErrors };

    const { error } = await supabase.from("admin_users").insert({
      user_id: userId,
      email: email.value,
      role: role.value,
      note: note.value,
      created_by: actorId,
    });
    if (error) return { ok: false, message: toChineseError(error) };

    refresh();
    return { ok: true, message: `已把 ${email.value} 加入後台人員` };
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }
}

/** 重設密碼。帳號與層級都不動。 */
export async function resetPassword(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  try {
    await requireManager();
    const userId = requireUserId(form);
    const password = String(form.get("password") ?? "");
    if (!password) {
      return { ok: false, message: "請填寫新密碼", fieldErrors: { password: "請填寫新密碼" } };
    }

    const result = await setUserPassword(userId, password);
    if (!result.ok) return { ok: false, message: result.message };

    return { ok: true, message: "密碼已更新，請把新密碼交給對方" };
  } catch (error) {
    const authState = toAuthErrorState(error);
    if (authState) return authState;
    throw error;
  }
}

/**
 * 改層級。
 *
 * ⚠️ 不能改自己。把自己降成操作人員之後，就沒有權限再改回來 —— 那是一條走進去
 * 出不來的路，而且只有另一個管理員能救。與其事後補救，不如在這裡擋掉。
 * （資料庫的 admin_users_keep_manager trigger 只保證「還有人是管理員」，
 * 它擋不住「你把自己降級、但別人還在」這種合法卻很痛的情況。）
 */
export async function updateRole(form: FormData): Promise<void> {
  try {
    const { supabase, userId: actorId } = await requireManager();
    const userId = requireUserId(form);
    const role = toAdminRole(String(form.get("role") ?? ""));

    if (userId === actorId) {
      console.error("[admin/users] 拒絕：不能改自己的層級");
      return;
    }

    const { error } = await supabase
      .from("admin_users")
      .update({ role })
      .eq("user_id", userId);
    if (error) console.error("[admin/users] 改層級失敗:", toChineseError(error));

    refresh();
  } catch (error) {
    if (toAuthErrorState(error)) return;
    throw error;
  }
}

/**
 * 移除後台權限（只刪白名單那一列，auth 帳號留著）。
 *
 * 與「刪除帳號」分開是刻意的：這一個是可逆的（用「加入現有帳號」就能加回來，
 * 對方的密碼也還是原本那組），刪帳號不是。停權與離職是兩件事。
 */
export async function revokeAccess(form: FormData): Promise<void> {
  try {
    const { supabase, userId: actorId } = await requireManager();
    const userId = requireUserId(form);

    if (userId === actorId) {
      console.error("[admin/users] 拒絕：不能移除自己的權限");
      return;
    }

    const { error } = await supabase.from("admin_users").delete().eq("user_id", userId);
    if (error) console.error("[admin/users] 移除權限失敗:", toChineseError(error));

    refresh();
  } catch (error) {
    if (toAuthErrorState(error)) return;
    throw error;
  }
}

/**
 * 刪除整個帳號。不可逆。
 *
 * admin_users.user_id 是 on delete cascade，所以白名單那一列會跟著消失 ——
 * 不需要（也不該）另外去刪。
 */
export async function deleteUser(form: FormData): Promise<void> {
  try {
    const { userId: actorId } = await requireManager();
    const userId = requireUserId(form);

    if (userId === actorId) {
      console.error("[admin/users] 拒絕：不能刪除自己的帳號");
      return;
    }

    const result = await deleteAuthUser(userId);
    if (!result.ok) {
      // 從對話框觸發，沒有地方顯示回傳訊息，所以失敗的表現就是「它沒有消失」。
      console.error("[admin/users] 刪除帳號失敗:", result.message);
      return;
    }

    refresh();
  } catch (error) {
    if (toAuthErrorState(error)) return;
    throw error;
  }
}
