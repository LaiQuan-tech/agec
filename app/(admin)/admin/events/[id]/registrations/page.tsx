import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { CONFIRMED, headcountOf, loadRegistrations } from "@/lib/admin/events";
import { gradYearLabel } from "@/lib/alumni-events";
import { Button } from "@/components/admin/ui/Button";
import { EmptyState, Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { CancelButton } from "./CancelButton";

export const metadata: Metadata = { title: "報名名單" };
export const dynamic = "force-dynamic";

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

export default async function RegistrationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireAdminOrRedirect();
  const { id } = await params;
  const n = /^\d+$/.test(id) ? Number(id) : NaN;
  if (!Number.isSafeInteger(n)) notFound();

  const { data: event } = await supabase
    .from("alumni_events")
    .select("id, slug, title, capacity, seats_taken, starts_at")
    .eq("id", n)
    .maybeSingle<{
      id: number;
      slug: string;
      title: string;
      capacity: number | null;
      seats_taken: number;
      starts_at: string;
    }>();
  if (!event) notFound();

  const { rows, error } = await loadRegistrations(supabase, n);
  const confirmed = rows.filter((r) => r.status === CONFIRMED);
  const headcount = headcountOf(rows);
  // ⚠️ 這兩個數字應該永遠相等（由同一支函式成對維護）。不相等就是有人手改過
  // 資料庫，而那會直接影響現場準備幾個位子，所以要在最顯眼的地方講出來。
  const drift = headcount !== event.seats_taken;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
            報名名單
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
            {event.title}　·　{confirmed.length} 筆有效報名，共 {headcount} 人（含攜伴）
            {event.capacity != null && `　·　名額 ${event.capacity} 位`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link href={`/admin/events/${event.id}`}>
            <Button variant="ghost" size="sm">
              回到活動
            </Button>
          </Link>
          {/* 下載走一般的 <a>，不是 next/link：這是一個檔案不是路由，
              預抓一份 CSV 沒有意義。 */}
          <a href={`/admin/api/events/${event.id}/roster.csv`}>
            <Button variant="primary" size="sm">
              下載 CSV
            </Button>
          </a>
        </div>
      </header>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </p>
      )}

      {drift && (
        <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
          ⚠️ 名額欄位記錄 {event.seats_taken} 人，但名單推算是 {headcount} 人。
          這兩個數字正常情況下一定相等 —— 不一致通常表示有人直接在資料庫改過
          seats_taken。請以名單為準，並回報這個狀況。
        </p>
      )}

      {rows.length === 0 && !error ? (
        <EmptyState message="目前還沒有人報名" />
      ) : rows.length > 0 ? (
        <Table>
          <THead>
            <TH className="w-[100px]">報名時間</TH>
            <TH className="w-[110px]">代碼</TH>
            <TH>姓名</TH>
            <TH className="w-[190px]">聯絡方式</TH>
            <TH className="w-[130px]">學制／畢業年</TH>
            <TH className="w-[70px]">人數</TH>
            <TH>飲食／備註</TH>
            <TH className="w-[100px]">操作</TH>
          </THead>
          <TBody>
            {rows.map((row) => {
              const cancelled = row.status !== CONFIRMED;
              return (
                <TR key={row.id}>
                  <TD className="whitespace-nowrap tabular-nums">{taipei(row.createdAt)}</TD>
                  <TD className="font-mono text-[12px]">{row.code}</TD>
                  <TD>
                    {row.name}
                    {cancelled && (
                      <span
                        className="ml-2 rounded px-1.5 py-0.5 text-[12px]"
                        style={{ background: "#fee2e2", color: "#991b1b" }}
                      >
                        已取消
                      </span>
                    )}
                  </TD>
                  <TD className="text-[12px]">
                    {/* mailto/tel 讓系辦點一下就能聯絡，這是這張表最常見的用途。 */}
                    <a href={`mailto:${row.email}`} className="hover:underline underline-offset-2">
                      {row.email}
                    </a>
                    {row.phone && (
                      <>
                        <br />
                        <a href={`tel:${row.phone}`} className="hover:underline underline-offset-2">
                          {row.phone}
                        </a>
                      </>
                    )}
                  </TD>
                  <TD className="text-[12px]">
                    {row.program ?? "—"}
                    {row.gradYear != null && (
                      <>
                        <br />
                        {gradYearLabel(row.gradYear, "zh")}
                      </>
                    )}
                  </TD>
                  <TD className="tabular-nums">
                    {1 + row.guests}
                    {row.guests > 0 && (
                      <span className="text-[12px]" style={{ color: "var(--muted)" }}>
                        {" "}
                        (+{row.guests})
                      </span>
                    )}
                  </TD>
                  <TD className="text-[12px]">
                    {row.dietary && <div>{row.dietary}</div>}
                    {row.note && (
                      <div style={{ color: "var(--muted)" }}>{row.note}</div>
                    )}
                    {!row.dietary && !row.note && "—"}
                  </TD>
                  <TD>
                    {cancelled ? (
                      <span className="text-[12px]" style={{ color: "var(--muted)" }}>
                        —
                      </span>
                    ) : (
                      <CancelButton
                        registrationId={row.id}
                        eventId={event.id}
                        slug={event.slug}
                        name={row.name}
                      />
                    )}
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
