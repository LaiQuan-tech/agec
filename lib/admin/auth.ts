import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/ssr-server";
import {
  NotAdminError,
  NotAuthenticatedError,
  NotManagerError,
} from "@/lib/admin/errors";

/**
 * The authorization boundary for the admin area.
 *
 * Next's own auth guide is explicit that a layout is not enough: layouts don't
 * re-render on navigation because of partial rendering, so a check placed only
 * there won't run on every route change. The same guide says render-time gating
 * is not a security boundary for Server Actions, which are reachable by anyone
 * who can POST to the route.
 *
 * So: every admin page calls requireAdminOrRedirect(), and every Server Action
 * calls requireAdmin(). React's cache() dedupes the work within a single
 * request, so the repetition costs one round-trip, not N.
 *
 * `import "server-only"` makes an accidental import from a Client Component a
 * build-time error rather than a bundle leak.
 */

/**
 * 後台的兩層權限。
 *
 * ⚠️ `admin` 在這裡是「管理員」（能管人、看操作日誌），不是「後台使用者」。
 * 資料庫那邊的命名比較容易誤會：`is_admin()` 對操作人員也回 true，因為它的
 * 意思是「在白名單裡」。判斷層級一律用 `role`，不要用 `isAdmin`。
 */
export type AdminRole = "admin" | "operator";

type Session = {
  supabase: SupabaseClient;
  userId: string;
  email: string | null;
  /** 在白名單裡（兩種層級都算）＝ 可以進後台、可以編內容。 */
  isAdmin: boolean;
  /** 層級。不在白名單時為 null。 */
  role: AdminRole | null;
};

/**
 * Reads the verified session once per request. Returns null when there is no
 * valid token — callers decide whether that's a redirect or an error.
 */
const readSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();

  // getClaims() validates the JWT signature. getSession() must never be trusted
  // in server code — it doesn't guarantee revalidation.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  // Being logged in is not the same as being allowed to edit. Sign-ups are open
  // on this Supabase project, so membership of admin_users is what actually
  // grants write access (see supabase/migrations/*_admin_allowlist.sql).
  //
  // 問 admin_role() 而不是 is_admin()：一次呼叫同時回答「在不在白名單」與
  // 「是哪一層」。它與 is_manager() 讀同一張表的同一欄，所以這裡的判斷不會
  // 與資料庫實際允許的事情分岔。
  const { data: role, error } = await supabase.rpc("admin_role");

  let parsed: AdminRole | null =
    role === "admin" || role === "operator" ? role : null;

  if (error) {
    console.error("[admin/auth] admin_role() failed:", error.code, error.message);

    /*
     * 🔴 部署順序的保險。
     *
     * `admin_role()` 是 20260902100000 這支 migration 建的，而這個專案的
     * migration 是人工貼進 Dashboard 執行的 —— 程式先上、migration 後跑的那段
     * 空窗期裡，這個 rpc 會失敗。少了這個 fallback，`parsed` 是 null → isAdmin
     * 是 false → **全部的人都被鎖在後台外面**，包含要去跑 migration 的那個人。
     *
     * 所以：函式不存在時退回問 is_admin()，並把在白名單裡的人當成管理員 ——
     * 那正是這支 migration 之前的實況（沒有分層，白名單裡的人什麼都能做）。
     * 空窗期維持原本的行為，比讓所有人進不去安全得多。
     *
     * ⚠️ 只在「函式不存在」（42883 / PGRST202）時退，不是任何錯誤都退。
     *    其他錯誤（例如權限問題）退成管理員就是提權了。
     */
    const missing =
      error.code === "42883" ||
      error.code === "PGRST202" ||
      /could not find the function|does not exist/i.test(error.message ?? "");

    if (missing) {
      const { data: isAdminFallback } = await supabase.rpc("is_admin");
      parsed = isAdminFallback === true ? "admin" : null;
      console.warn(
        "[admin/auth] admin_role() 不存在，暫時退回 is_admin()。" +
          "請盡快執行 supabase/migrations/20260902100000_admin_user_management.sql。"
      );
    }
  }

  return {
    supabase,
    userId: String(claims.sub),
    email: typeof claims.email === "string" ? claims.email : null,
    isAdmin: parsed !== null,
    role: parsed,
  };
});

/** For Server Components. Sends anonymous visitors to the login page. */
export async function requireAdminOrRedirect(): Promise<Session> {
  const session = await readSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/login?error=not_admin");
  return session;
}

/**
 * For Server Actions. Throws instead of redirecting so the action can return a
 * message the form is able to display — a redirect would discard whatever the
 * user had typed.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await readSession();
  if (!session) throw new NotAuthenticatedError();
  if (!session.isAdmin) throw new NotAdminError();
  return session;
}

/**
 * 管理員限定的 Server Component 版本（人員管理、操作日誌）。
 *
 * ⚠️ 這與「隱藏選單」是兩件事。AdminShell 依 role 不渲染那兩個項目，但那只是
 * 畫面：Next 的 layout 在前端導覽時不會重新渲染，而任何人只要知道網址就打得到
 * 這些頁面。所以每一頁都要自己呼叫這一支。
 *
 * 操作人員送到 /admin 而不是 /login：他確實登入了、也確實有後台權限，只是
 * 沒有這一頁的權限。丟回登入頁會讓他以為自己沒登入。
 */
export async function requireManagerOrRedirect(): Promise<Session> {
  const session = await readSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/login?error=not_admin");
  if (session.role !== "admin") redirect("/admin?error=not_manager");
  return session;
}

/**
 * 管理員限定的 Server Action 版本。
 *
 * ⚠️ 每一個會動到人員或讀取日誌的 action 都要呼叫這一支 —— Server Action 是
 * 對頁面路由的 POST，頁面層的檢查擋不住直接 POST 的人。
 */
export async function requireManager(): Promise<Session> {
  const session = await readSession();
  if (!session) throw new NotAuthenticatedError();
  if (!session.isAdmin) throw new NotAdminError();
  if (session.role !== "admin") throw new NotManagerError();
  return session;
}

/** Non-throwing variant, for deciding whether to render a "log in" link. */
export async function getOptionalSession(): Promise<Session | null> {
  return readSession();
}
