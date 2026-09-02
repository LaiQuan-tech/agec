import type { Metadata } from "next";
import Link from "next/link";
import { requireManagerOrRedirect } from "@/lib/admin/auth";
import {
  ACTION_LABEL,
  AUDIT_PAGE_SIZE,
  ENTITY_LABEL,
  loadAuditLog,
} from "@/lib/admin/audit";
import { EmptyState, Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";

export const metadata: Metadata = { title: "操作日誌" };
export const dynamic = "force-dynamic";

const ACTION_STYLE: Record<string, { background: string; color: string }> = {
  insert: { background: "#dcfce7", color: "#166534" },
  update: { background: "#e0e7ff", color: "#3730a3" },
  delete: { background: "#fee2e2", color: "#991b1b" },
};

function taipei(iso: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export default async function LogsPage({
  searchParams,
}: {
  // Next 16：searchParams 是 promise。
  searchParams: Promise<{ entity?: string }>;
}) {
  // ⚠️ 管理員限定 —— 日誌會顯示每一位人員做過什麼，那不是同事之間互相看的東西。
  const { supabase } = await requireManagerOrRedirect();
  const { entity } = await searchParams;

  /*
   * searchParams 在這裡沒問題，與前台不同。
   *
   * 前台整站是靜態 ISR，讀 searchParams 會讓路由變成動態，所以那邊的篩選一律
   * 走路徑片段（見 lib/news-categories.ts）。後台是 force-dynamic，本來就每次
   * 重算，用查詢字串反而比多開一堆路由乾淨。
   */
  const { rows, error } = await loadAuditLog(supabase, { entity });
  const active = entity && ENTITY_LABEL[entity] ? entity : undefined;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
          操作日誌
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
          後台的新增、修改與刪除紀錄，最近 {AUDIT_PAGE_SIZE} 筆。只有管理員看得到。
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </p>
      )}

      {/* 篩選。用連結而不是 <select>＋JS：後台是 server-rendered，一個連結就
          夠了，而且篩選後的網址可以直接貼給人。 */}
      <nav className="flex flex-wrap gap-1" aria-label="依項目篩選">
        <FilterLink label="全部" href="/admin/logs" active={!active} />
        {Object.entries(ENTITY_LABEL).map(([key, label]) => (
          <FilterLink
            key={key}
            label={label}
            href={`/admin/logs?entity=${key}`}
            active={active === key}
          />
        ))}
      </nav>

      {rows.length === 0 && !error ? (
        <EmptyState
          message={
            active
              ? `「${ENTITY_LABEL[active]}」還沒有任何操作紀錄`
              : "還沒有任何操作紀錄"
          }
        />
      ) : (
        <Table>
          <THead>
            <TH className="w-[110px]">時間</TH>
            <TH className="w-[210px]">操作者</TH>
            <TH className="w-[70px]">動作</TH>
            <TH className="w-[110px]">項目</TH>
            <TH>名稱</TH>
          </THead>
          <TBody>
            {rows.map((row) => (
              <TR key={row.id}>
                <TD className="whitespace-nowrap tabular-nums text-[12px]">
                  {taipei(row.changedAt)}
                </TD>
                <TD className="text-[12px]">{row.actorEmail ?? "（帳號已刪除）"}</TD>
                <TD>
                  <span
                    className="rounded px-1.5 py-0.5 text-[12px] font-medium"
                    style={ACTION_STYLE[row.action]}
                  >
                    {ACTION_LABEL[row.action] ?? row.action}
                  </span>
                </TD>
                <TD className="text-[12px]">{ENTITY_LABEL[row.entity] ?? row.entity}</TD>
                <TD className="text-[13px]">
                  {row.label ?? (
                    <span style={{ color: "var(--muted)" }}>
                      （編號 {row.entityId ?? "?"}）
                    </span>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {/*
        已知缺口，寫出來而不是假裝沒有：從 Supabase Dashboard 直接改資料不會
        留下紀錄。日誌只記錄「有登入的後台使用者」做的事 —— 否則每一筆公開的
        系友報名都會 update alumni_events.seats_taken，日誌會被淹沒。
      */}
      <p className="text-[12px]" style={{ color: "var(--muted)" }}>
        ⚠️ 只記錄從後台登入後做的操作。直接在 Supabase 後台改資料、以及前台的
        系友報名，都不會出現在這裡。
      </p>
    </div>
  );
}

function FilterLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="rounded-md px-3 py-1.5 text-[13px]"
      style={
        active
          ? { background: "var(--brand-green)", color: "#fff" }
          : { background: "#fff", color: "var(--ink)", border: "1px solid var(--hairline)" }
      }
    >
      {label}
    </Link>
  );
}
