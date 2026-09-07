import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { Button } from "@/components/admin/ui/Button";
import { EmptyState, Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EnBadge, enProgress } from "../_components/EnBadge";
import { deleteCapability } from "./actions";

export const metadata: Metadata = { title: "核心能力" };
export const dynamic = "force-dynamic";

/**
 * 桌機版單行放得下的標籤數。
 *
 * 不是猜的：app/(site)/site-extensions.css:745-762 記著當初把 .capability-cloud
 * 的 28% 縮排拿掉時量到的數字 —— 原本 8 顆佔 1063px、容器只有 1066px，只差 3px
 * 就折行；拿掉縮排之後容器變 1480px，餘裕 417px。以每顆平均 133px 估，再多三顆
 * 就會用完。超過只是折成第二行（flex-wrap 是刻意保留的，860px 以下本來就要折），
 * 不是壞掉，但當初系辦特別要求單行，所以超過時提醒一聲。
 */
const ONE_LINE_MAX = 11;

type Row = {
  id: number;
  label: string;
  label_en: string | null;
  sort_order: number;
};

export default async function CapabilitiesListPage() {
  const { supabase } = await requireAdminOrRedirect();

  const { data, error } = await supabase
    .from("capabilities")
    .select("id, label, label_en, sort_order")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })
    .returns<Row[]>();

  if (error) {
    console.error("[admin/capabilities] list failed:", error.message);
  }
  const rows = data ?? [];

  // 資料表還沒建（migration 未執行）與「真的一筆都沒有」要分開講：前者前台仍
  // 顯示程式碼裡原本那 8 顆，後者也是 —— 但該做的事完全不同。
  const tableMissing = error?.code === "42P01" || error?.code === "PGRST205";

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
            核心能力
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
            「招生資訊」頁下方那一排圓角標籤。桌機單行大約放得下 10 個，超過會自動折到第二行。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admissions#section-3" target="_blank">
            <Button variant="ghost" size="sm" title="在新分頁開啟前台的核心能力區塊">
              前台 ↗︎
            </Button>
          </Link>
          <Link href="/admin/capabilities/new">
            <Button variant="primary">新增標籤</Button>
          </Link>
        </div>
      </header>

      {tableMissing ? (
        <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
          資料表還沒建立。請先在 Supabase Dashboard 執行
          <code className="mx-1">supabase/migrations/20260908110000_capabilities.sql</code>
          。在那之前，前台會繼續顯示程式碼裡原本那 8 個標籤，網站不受影響。
        </p>
      ) : error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          讀取失敗，請重新整理。若持續發生請回報。
        </p>
      ) : null}

      {rows.length > ONE_LINE_MAX && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
          目前有 {rows.length} 個標籤，桌機版會折成兩行。這不是錯誤，只是提醒你原本的版面是設計成一行的。
        </p>
      )}

      {rows.length === 0 && !error ? (
        <EmptyState
          message="目前沒有任何標籤（前台會顯示程式碼裡預設的 8 個）"
          action={
            <Link href="/admin/capabilities/new">
              <Button variant="primary" size="sm">
                新增第一個標籤
              </Button>
            </Link>
          }
        />
      ) : rows.length > 0 ? (
        <Table>
          <THead>
            <TH className="w-[70px]">排序</TH>
            <TH>標籤文字</TH>
            <TH>英文</TH>
            <TH className="w-[80px]">翻譯</TH>
            <TH className="w-[160px]">操作</TH>
          </THead>
          <TBody>
            {rows.map((row) => {
              const en = enProgress([[row.label, row.label_en]]);
              return (
                <TR key={row.id}>
                  <TD className="tabular-nums">{row.sort_order}</TD>
                  <TD>
                    <Link
                      href={`/admin/capabilities/${row.id}`}
                      className="hover:underline underline-offset-2"
                    >
                      {row.label}
                    </Link>
                  </TD>
                  <TD className="text-[13px]" style={{ color: "var(--muted)" }}>
                    {row.label_en ?? "（未填，英文版會顯示中文）"}
                  </TD>
                  <TD>
                    <EnBadge filled={en.filled} total={en.total} />
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/capabilities/${row.id}`}>
                        <Button variant="ghost" size="sm">
                          編輯
                        </Button>
                      </Link>
                      <DeleteButton
                        action={deleteCapability}
                        id={row.id}
                        itemLabel={row.label}
                      />
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
