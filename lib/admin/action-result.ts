import {
  NotAdminError,
  NotAuthenticatedError,
  NotManagerError,
} from "@/lib/admin/errors";

/**
 * The shape every admin Server Action returns, so FormShell can render the
 * result without knowing which entity it came from.
 *
 * Deliberately unlike the read path in lib/data.ts, which logs errors and
 * degrades to an empty array. That's right for a public page — a section
 * showing "no items" beats a 500. It is wrong for the admin: a write that
 * silently fails leaves the office staff believing their edit was saved.
 */
export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const idleState: ActionState = { ok: false };

/**
 * Postgres error shape as surfaced by supabase-js.
 *
 * Note there is no `constraint` field: PostgrestError carries only code /
 * message / details / hint, and the constraint name arrives inside `message`
 * ('duplicate key value violates unique constraint "posts_slug_key"'). Matching
 * on a `constraint` property compiles fine and silently never fires.
 */
type PostgresErrorLike = {
  code?: string;
  message?: string;
  details?: string | null;
};

/**
 * 具名約束 → 給系辦看的中文。
 *
 * 這裡列的每一條都是資料庫上真的存在、而且從後台操作碰得到的約束（2026-09-08
 * 對正式站的 pg_constraint 清查過）。原本那五條 posts_* 已隨部落格資料表一起
 * 刪除，不再列出。
 *
 * ⚠️ 新增具名 CHECK 或 UNIQUE 的時候記得回來補一條，否則系辦會看到通用的
 *    「資料不符合規則」，不知道要改哪個欄位。
 *
 * 沒有列出來的幾條是後台碰不到的：alumni_events_not_oversold 與
 * alumni_events_seats_nonneg 由 register_for_alumni_event() 獨佔維護，
 * admin_audit_log_action_valid 只有 trigger 寫得進去。
 */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  news_status_check: "消息狀態不正確",
  admin_users_role_valid: "層級只能是「管理員」或「操作人員」",
  alumni_events_title_not_blank: "活動名稱不能空白",
  alumni_events_slug_format: "網址代稱只能用小寫英文、數字與連字號",
  alumni_events_status_valid: "活動狀態不正確",
  alumni_events_time_valid: "結束時間不能早於開始時間",
  alumni_events_capacity_nonneg: "名額不能是負數",
  alumni_registrations_name_not_blank: "報名人姓名不能空白",
  alumni_registrations_email_shape: "電子信箱的格式看起來不對，請確認有 @ 與網域",
  alumni_registrations_guests_range: "同行人數超出允許範圍",
  alumni_registrations_status_valid: "報名狀態不正確",
};

/**
 * Turns a Supabase/Postgres error into something the office staff can act on.
 * Raw English driver messages are never shown — but they are always logged, so
 * an unrecognised code can still be diagnosed from the server logs.
 */
export function toChineseError(error: PostgresErrorLike): string {
  console.error("[admin] write failed:", error.code, error.message, error.details);

  const message = error.message ?? "";
  const named = Object.keys(CONSTRAINT_MESSAGES).find((name) => message.includes(name));
  if (named) return CONSTRAINT_MESSAGES[named];

  switch (error.code) {
    case "23505":
      return "這筆資料與現有的重複，請檢查後再試";
    case "23514":
      return "資料不符合欄位限制，請檢查填寫內容";
    case "23503":
      return "這筆資料被其他項目引用，無法直接刪除";
    case "22P02":
      return "欄位格式不正確（例如數字欄位填了文字）";
    case "42501":
    case "PGRST301":
      return "你的帳號沒有寫入權限，請聯絡開發者把帳號加入管理者名單";
    default:
      return `儲存失敗（代碼 ${error.code ?? "unknown"}），請截圖回報`;
  }
}

/**
 * Maps the auth errors thrown by requireAdmin() onto an ActionState. Anything
 * else is rethrown — including Next's redirect(), which is implemented as a
 * thrown control-flow exception and must not be swallowed.
 */
export function toAuthErrorState(error: unknown): ActionState | null {
  if (error instanceof NotAuthenticatedError) {
    return { ok: false, message: "登入已逾時，請重新登入" };
  }
  if (error instanceof NotAdminError) {
    return {
      ok: false,
      message: "你的帳號不在管理者名單內，請聯絡開發者",
    };
  }
  if (error instanceof NotManagerError) {
    // 與上一條分開：這個人可以用後台，只是這一件事不歸他。叫他去聯絡開發者
    // 是錯的下一步 —— 正確的是找管理員。
    return {
      ok: false,
      message: "這項操作限管理員，請聯絡系上的後台管理員",
    };
  }
  return null;
}
