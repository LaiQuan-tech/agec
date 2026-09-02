import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 操作日誌的讀取。
 *
 * ⚠️ 這個檔**只讀**。日誌是由資料庫的 trigger 寫的（`log_admin_change()`），
 * 應用層沒有、也不該有寫入的管道 —— 一份可以被當事人寫入或編輯的稽核日誌
 * 沒有意義。`admin_audit_log` 上刻意只有一條 select policy，連管理員都寫不進去。
 *
 * ⚠️ 這支不做授權。呼叫端必須先 requireManagerOrRedirect()。傳進來的是後台的
 * session client，所以就算漏了那一步，RLS 的 `is_manager()` 也會擋下來 ——
 * 但別依賴那個，它是最後一道。
 */

/** 資料表名 → 系辦看得懂的名稱。 */
export const ENTITY_LABEL: Record<string, string> = {
  news: "最新消息",
  faculty: "系所成員",
  courses: "課程",
  programs: "招生學制",
  links: "連結卡片",
  alumni_events: "系友活動",
  alumni_event_registrations: "系友報名",
  admin_users: "後台人員",
};

export const ACTION_LABEL: Record<string, string> = {
  insert: "新增",
  update: "修改",
  delete: "刪除",
};

export type AuditEntry = {
  id: number;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  label: string | null;
  changedAt: string;
};

/**
 * 最近的操作紀錄。
 *
 * 預設 200 筆而不是全部：這張表只增不減，一年後會有幾萬列，而系辦要看的永遠是
 * 「最近發生了什麼」。真的要查更早的，加上 entity 篩選再往回翻比無限捲動有用。
 */
export const AUDIT_PAGE_SIZE = 200;

export async function loadAuditLog(
  supabase: SupabaseClient,
  options: { entity?: string } = {}
): Promise<{ rows: AuditEntry[]; error: string }> {
  let query = supabase
    .from("admin_audit_log")
    .select("id, actor_email, action, entity, entity_id, label, changed_at");

  // 只接受已知的資料表名。網址列打進來的東西不會變成查詢條件裡的自由字串 ——
  // PostgREST 會跳脫，但把未知值當成合法篩選只會回一頁空白，不如當作沒有篩選。
  if (options.entity && ENTITY_LABEL[options.entity]) {
    query = query.eq("entity", options.entity);
  }

  const { data, error } = await query
    .order("changed_at", { ascending: false })
    .limit(AUDIT_PAGE_SIZE)
    .returns<
      {
        id: number;
        actor_email: string | null;
        action: string;
        entity: string;
        entity_id: string | null;
        label: string | null;
        changed_at: string;
      }[]
    >();

  if (error) {
    console.error("[admin/audit] 讀取失敗:", error.code, error.message);
    // 42P01 = 表不存在，也就是 migration 還沒跑。這在這個專案是真的會發生的
    // 狀態（沒有 CLI，migration 是人工貼進 Dashboard 的），值得單獨講清楚，
    // 否則系辦看到的是一個沒有下一步的錯誤。
    if (error.code === "42P01") {
      return {
        rows: [],
        error:
          "資料表還不存在。請先在 Supabase Dashboard 執行 " +
          "supabase/migrations/20260902100000_admin_user_management.sql。",
      };
    }
    return { rows: [], error: "讀取失敗，請重新整理。若持續發生請回報。" };
  }

  return {
    rows: (data ?? []).map((r) => ({
      id: r.id,
      actorEmail: r.actor_email,
      action: r.action,
      entity: r.entity,
      entityId: r.entity_id,
      label: r.label,
      changedAt: r.changed_at,
    })),
    error: "",
  };
}
