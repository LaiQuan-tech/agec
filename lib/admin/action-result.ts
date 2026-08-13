import { NotAdminError, NotAuthenticatedError } from "@/lib/admin/errors";

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

const CONSTRAINT_MESSAGES: Record<string, string> = {
  posts_slug_key: "網址代稱已被使用，請換一個",
  posts_slug_format: "網址代稱只能用小寫英文、數字與連字號",
  posts_status_check: "文章狀態不正確",
  posts_published_needs_date: "設為「已發佈」時必須填寫發佈時間",
  posts_title_not_blank: "標題不能空白",
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
  return null;
}
