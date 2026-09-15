import type { Metadata } from "next";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { ADMIN_SITE_MAP, ADMIN_SYSTEM } from "@/lib/admin/site-map";

export const metadata: Metadata = { title: "總覽" };
export const dynamic = "force-dynamic";

/**
 * 儀表板 = 網站地圖：前台每一頁一張卡，卡裡列出那一頁可以編輯的區塊與入口。
 * 與側欄讀同一份 lib/admin/site-map.ts，所以兩邊永遠一致。
 *
 * 每個區塊右側印筆數，讓系辦一眼看出哪一區還是空的。筆數怎麼算是由後台入口
 * 決定的（下面 COUNTS）：帶 `?section=` 的入口只算那個 section；沒有表的入口
 * （學生專區、本系簡介的文案是固定格位，page_copy 的列數不是「筆數」）不印數字。
 */

/** 後台入口 → 怎麼算筆數。沒列在這裡的入口不印數字。 */
const COUNTS: Record<string, { table: string; section?: string; managerOnly?: boolean }> = {
  "/admin/news": { table: "news" },
  "/admin/faculty": { table: "faculty" },
  "/admin/courses": { table: "courses" },
  "/admin/programs": { table: "programs" },
  "/admin/capabilities": { table: "capabilities" },
  "/admin/events": { table: "alumni_events" },
  "/admin/links?section=students": { table: "links", section: "students" },
  "/admin/links?section=admissions": { table: "links", section: "admissions" },
  "/admin/documents?section=courses": { table: "documents", section: "courses" },
  "/admin/documents?section=admissions": { table: "documents", section: "admissions" },
  // ⚠️ managerOnly：操作人員的 RLS 讀不到 admin_users，撈出來一定是 0，
  //    印一個假的「0 筆」比不印更糟。
  "/admin/users": { table: "admin_users", managerOnly: true },
};

async function countRows(
  supabase: SupabaseClient,
  spec: { table: string; section?: string }
): Promise<number | null> {
  let query = supabase.from(spec.table).select("id", { count: "exact", head: true });
  if (spec.section) query = query.eq("section", spec.section);
  const { count, error } = await query;
  if (error) {
    console.error(`[admin] count ${spec.table} failed:`, error.message);
    return null;
  }
  return count ?? 0;
}

export default async function AdminDashboard({
  searchParams,
}: {
  // Next 16：searchParams 是 promise。後台是 force-dynamic，讀它沒有副作用。
  searchParams: Promise<{ error?: string }>;
}) {
  // Re-checked here rather than relying on the layout — see lib/admin/auth.ts.
  const { supabase, email, role } = await requireAdminOrRedirect();
  const { error: errorCode } = await searchParams;
  const isManager = role === "admin";

  // 全部入口的筆數一次並行算完，再依 href 查表。
  const entries = Object.entries(COUNTS).filter(([, spec]) => isManager || !spec.managerOnly);
  const counted = await Promise.all(
    entries.map(async ([href, spec]) => [href, await countRows(supabase, spec)] as const)
  );
  const countByHref = new Map<string, number | null>(counted);

  const groups = [
    ...ADMIN_SITE_MAP,
    ...(isManager
      ? [{ href: "", label: "系統", blocks: ADMIN_SYSTEM, note: undefined }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
          總覽
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--muted)" }}>
          {email ? `${email}，` : ""}
          網站的每一頁對應到下面的一張卡；找到要改的頁面，點該區塊進去新增或修改。
          存檔後前台立刻更新。
        </p>
      </header>

      {errorCode === "not_manager" && (
        <p
          role="alert"
          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-800"
        >
          那一頁限「管理員」使用。你目前是「操作人員」，可以編輯所有內容，但不能
          管理人員或查看操作日誌。需要的話請聯絡系上的後台管理員。
        </p>
      )}

      <section className="grid gap-3 lg:grid-cols-2">
        {groups.map((g) => (
          <article
            key={g.href || g.label}
            className="rounded-lg border bg-white p-4"
            style={{ borderColor: "var(--hairline)" }}
          >
            <header className="flex items-baseline justify-between gap-2">
              <h2 className="text-[15px] font-bold" style={{ color: "var(--ink)" }}>
                {g.label}
              </h2>
              {g.href ? (
                <Link
                  href={g.href}
                  target="_blank"
                  className="text-[12px] hover:underline"
                  style={{ color: "var(--muted)" }}
                >
                  前台 ↗︎
                </Link>
              ) : null}
            </header>

            {g.blocks.length === 0 ? (
              <p className="mt-2 text-[13px]" style={{ color: "var(--muted)" }}>
                {g.note}
              </p>
            ) : (
              <ul className="mt-2 flex flex-col">
                {g.blocks
                  .filter((b) => isManager || !b.managerOnly)
                  .map((b) => {
                    const count = countByHref.get(b.href);
                    return (
                      <li
                        key={b.href}
                        className="flex items-center justify-between gap-3 border-t py-2 first:border-t-0"
                        style={{ borderColor: "var(--hairline)" }}
                      >
                        <div className="min-w-0">
                          <Link
                            href={b.href}
                            className="text-[14px] hover:underline underline-offset-2"
                            style={{ color: "var(--ink)" }}
                          >
                            {b.label} →
                          </Link>
                          {b.note ? (
                            <p className="text-[12px]" style={{ color: "var(--muted)" }}>
                              {b.note}
                            </p>
                          ) : null}
                        </div>
                        {b.href in COUNTS ? (
                          <span className="shrink-0 tabular-nums text-[13px]" style={{ color: "var(--muted)" }}>
                            {count == null ? "—" : `${count} 筆`}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
              </ul>
            )}
          </article>
        ))}
      </section>

      <section
        className="rounded-lg border p-4 text-[13px]"
        style={{ borderColor: "var(--cream-border)", background: "var(--cream)" }}
      >
        <p className="font-medium" style={{ color: "var(--ink)" }}>
          小提醒
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5" style={{ color: "var(--ink-soft)" }}>
          <li>「最新消息」可以只放一行公告，也可以用編輯器寫完整內文。</li>
          <li>同一個東西供應好幾頁（例如學制），在每一頁底下都會看到同一個入口。</li>
          <li>刪除無法復原，刪除前系統會再問一次。</li>
          <li>存檔後前台會立刻更新；若沒看到變化，重新整理一次瀏覽器。</li>
        </ul>
      </section>
    </div>
  );
}
