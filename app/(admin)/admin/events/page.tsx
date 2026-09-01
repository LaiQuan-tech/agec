import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { loadEventList } from "@/lib/admin/events";
import { Button } from "@/components/admin/ui/Button";
import { EmptyState, Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { EVENT_STATUS_SHORT, toEventStatus } from "./constants";

export const metadata: Metadata = { title: "系友活動" };
export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, { background: string; color: string }> = {
  draft: { background: "#fef3c7", color: "#92400e" },
  published: { background: "#dcfce7", color: "#166534" },
  cancelled: { background: "#fee2e2", color: "#991b1b" },
};

function taipei(iso: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export default async function EventsListPage() {
  const { supabase } = await requireAdminOrRedirect();
  const { rows, error } = await loadEventList(supabase);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
            系友活動
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
            系友回娘家等活動的上架與報名管理。上架後會出現在前台的「系友專區」。
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button variant="primary">新增活動</Button>
        </Link>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700"
        >
          {error}
        </p>
      )}

      {rows.length === 0 && !error ? (
        <EmptyState
          message="目前沒有任何活動"
          action={
            <Link href="/admin/events/new">
              <Button variant="primary" size="sm">
                新增第一場活動
              </Button>
            </Link>
          }
        />
      ) : rows.length > 0 ? (
        <Table>
          <THead>
            <TH className="w-[150px]">開始時間</TH>
            <TH>活動名稱</TH>
            <TH className="w-[90px]">狀態</TH>
            <TH className="w-[130px]">報名</TH>
            <TH className="w-[210px]">操作</TH>
          </THead>
          <TBody>
            {rows.map((row) => {
              const status = toEventStatus(row.status);
              // ⚠️ seats_taken 與名單推導出來的人數應該永遠相等（同一支函式成對
              // 維護）。不相等就是有人手改過資料庫，那時候要看得見，所以兩個
              // 數字都印，而且不一致時標紅。
              const drift = row.seatsTaken !== row.headcount;
              return (
                <TR key={row.id}>
                  <TD className="whitespace-nowrap tabular-nums">{taipei(row.startsAt)}</TD>
                  <TD>
                    <Link href={`/admin/events/${row.id}`} className="hover:underline underline-offset-2">
                      {row.title}
                    </Link>
                    {row.location && (
                      <span className="ml-2 text-[12px]" style={{ color: "var(--muted)" }}>
                        {row.location}
                      </span>
                    )}
                  </TD>
                  <TD>
                    <span
                      className="rounded px-1.5 py-0.5 text-[12px] font-medium"
                      style={STATUS_STYLE[status]}
                    >
                      {EVENT_STATUS_SHORT[status]}
                    </span>
                  </TD>
                  <TD className="tabular-nums">
                    {row.headcount}
                    {row.capacity != null && ` / ${row.capacity}`}
                    <span className="ml-1 text-[12px]" style={{ color: "var(--muted)" }}>
                      人
                    </span>
                    {drift && (
                      <span className="ml-1 text-[12px] text-red-600" title={`名額欄位是 ${row.seatsTaken}，與名單推算的 ${row.headcount} 不符`}>
                        ⚠
                      </span>
                    )}
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/events/${row.id}`}>
                        <Button variant="ghost" size="sm">
                          編輯
                        </Button>
                      </Link>
                      <Link href={`/admin/events/${row.id}/registrations`}>
                        <Button variant="ghost" size="sm">
                          報名名單
                        </Button>
                      </Link>
                      {status !== "draft" && (
                        <Link href={`/alumni/events/${row.slug}`} target="_blank">
                          <Button variant="ghost" size="sm" title="在新分頁開啟前台的這場活動">
                            前台 ↗︎
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      ) : null}
    </div>
  );
}
