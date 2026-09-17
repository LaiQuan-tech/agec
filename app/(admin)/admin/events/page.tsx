import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { loadEventList } from "@/lib/admin/events";
import { Button } from "@/components/admin/ui/Button";
import { EmptyState, Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import {
  EVENT_AUDIENCES,
  EVENT_AUDIENCE_SHORT,
  EVENT_STATUS_SHORT,
  eventBasePath,
  toEventAudience,
  toEventStatus,
} from "./constants";
import { EnBadge, enProgress } from "../_components/EnBadge";
import { AppearsOn } from "../_components/AppearsOn";
import { FilterLink } from "../_components/FilterLink";

export const metadata: Metadata = { title: "活動" };
export const dynamic = "force-dynamic";

const AUDIENCE_STYLE: Record<string, { background: string; color: string }> = {
  alumni: { background: "#e0f2fe", color: "#075985" },
  general: { background: "#ede9fe", color: "#5b21b6" },
};

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

export default async function EventsListPage({
  searchParams,
}: {
  // Next 16：searchParams 是 promise。後台是 force-dynamic，讀它沒有副作用。
  // `?audience=` 是側欄「最新消息 › 活動報名」／「系友專區 › 系友回娘家」
  // 兩個入口帶進來的（lib/admin/site-map.ts），認不得的值當成「全部」。
  searchParams: Promise<{ audience?: string }>;
}) {
  const { supabase } = await requireAdminOrRedirect();
  const { audience: audienceParam } = await searchParams;
  const audience = toEventAudience(audienceParam);
  const { rows, error } = await loadEventList(supabase, audience);
  // 從篩選狀態進「新增」時預選同一個對象，系辦少選一次。
  const newHref = audience ? `/admin/events/new?audience=${audience}` : "/admin/events/new";

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
            活動{audience ? ` · ${EVENT_AUDIENCE_SHORT[audience]}` : ""}
          </h1>
          <AppearsOn pathname="/admin/events" filters={{ audience }} />
          <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
            活動的上架與報名管理。系友活動上架後出現在「系友專區」的系友回娘家區塊；
            一般活動出現在「最新消息」的活動報名區塊，任何人都能報名。
          </p>
        </div>
        <Link href={newHref}>
          <Button variant="primary">新增活動</Button>
        </Link>
      </header>

      {/* 篩選籤：與 links / documents 的 `?section=` 同一個元件。 */}
      <nav aria-label="依對象篩選" className="flex flex-wrap items-center gap-2">
        <FilterLink label="全部" href="/admin/events" active={audience === null} />
        {EVENT_AUDIENCES.map((value) => (
          <FilterLink
            key={value}
            label={EVENT_AUDIENCE_SHORT[value]}
            href={`/admin/events?audience=${value}`}
            active={audience === value}
          />
        ))}
      </nav>

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
          message={
            audience ? `目前沒有任何${EVENT_AUDIENCE_SHORT[audience]}` : "目前沒有任何活動"
          }
          action={
            <Link href={newHref}>
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
            <TH className="w-[90px]">對象</TH>
            <TH className="w-[90px]">狀態</TH>
            <TH className="w-[130px]">報名</TH>
            <TH className="w-[80px]">英文</TH>
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
                    <Link href={`/admin/events/${row.id}?audience=${row.audience}`} className="hover:underline underline-offset-2">
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
                      style={AUDIENCE_STYLE[row.audience]}
                    >
                      {EVENT_AUDIENCE_SHORT[row.audience]}
                    </span>
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
                    {/* 與最新消息、系所成員等列表同一個裝置：一眼看出哪幾場的
                        英文還沒翻。系友活動原本是唯一沒有這一欄的實體。 */}
                    <EnBadge {...enProgress(row.enPairs)} />
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/events/${row.id}?audience=${row.audience}`}>
                        <Button variant="ghost" size="sm">
                          編輯
                        </Button>
                      </Link>
                      <Link href={`/admin/events/${row.id}/registrations?audience=${row.audience}`}>
                        <Button variant="ghost" size="sm">
                          報名名單
                        </Button>
                      </Link>
                      {/* 前綴跟著對象走：一般活動在 /news/events/，連到 /alumni/events/ 會是 404。 */}
                      {status !== "draft" && (
                        <Link href={`${eventBasePath(row.audience)}/${row.slug}`} target="_blank">
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
