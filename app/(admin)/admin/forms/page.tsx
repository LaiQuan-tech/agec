import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { Button } from "@/components/admin/ui/Button";
import { EmptyState, Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EnBadge, enProgress } from "../_components/EnBadge";
import { deleteCourseForm } from "./actions";

export const metadata: Metadata = { title: "系上表單" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  label: string;
  label_en: string | null;
  description: string | null;
  description_en: string | null;
  file_url: string | null;
  file_name: string | null;
  sort_order: number;
};

export default async function CourseFormsListPage() {
  const { supabase } = await requireAdminOrRedirect();

  const { data, error } = await supabase
    .from("course_forms")
    .select(
      "id, label, label_en, description, description_en, file_url, file_name, sort_order"
    )
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })
    .returns<Row[]>();

  if (error) {
    console.error("[admin/forms] list failed:", error.message);
  }
  const rows = data ?? [];

  // 資料表還沒建（migration 未執行）與「真的一筆都沒有」要分開講：兩種情況
  // 前台都不會印出這一區，但該做的事完全不同。
  const tableMissing = error?.code === "42P01" || error?.code === "PGRST205";
  const missingFile = rows.filter((row) => !row.file_url).length;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
            系上表單
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
            「課程資訊」頁最下方「常用表格」裡的下載卡。一筆都沒有的時候整區不會出現，
            底下那排教務處的連結不受影響。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/courses#section-3" target="_blank">
            <Button variant="ghost" size="sm" title="在新分頁開啟前台的常用表格區塊">
              前台 ↗︎
            </Button>
          </Link>
          <Link href="/admin/forms/new">
            <Button variant="primary">新增表單</Button>
          </Link>
        </div>
      </header>

      {tableMissing ? (
        <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
          資料表還沒建立。請先在 Supabase Dashboard 執行
          <code className="mx-1">supabase/migrations/20260908120000_course_forms.sql</code>
          。在那之前這一區不會出現在前台，網站其他部分不受影響。
        </p>
      ) : error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          讀取失敗，請重新整理。若持續發生請回報。
        </p>
      ) : null}

      {missingFile > 0 && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
          有 {missingFile} 筆還沒有檔案。這不是錯誤 —— 那幾張卡片會照常出現在前台，
          只是還不能點，等你補上檔案就會自動變成可下載。
        </p>
      )}

      {rows.length === 0 && !error ? (
        <EmptyState
          message="目前沒有任何表單（前台的「系上表單」區塊不會出現）"
          action={
            <Link href="/admin/forms/new">
              <Button variant="primary" size="sm">
                新增第一份表單
              </Button>
            </Link>
          }
        />
      ) : rows.length > 0 ? (
        <Table>
          <THead>
            <TH className="w-[70px]">排序</TH>
            <TH>表單名稱</TH>
            <TH>檔案</TH>
            <TH className="w-[80px]">翻譯</TH>
            <TH className="w-[160px]">操作</TH>
          </THead>
          <TBody>
            {rows.map((row) => {
              // 兩對中英欄位一起算，跟其他列表頁的徽章同一個口徑。
              const en = enProgress([
                [row.label, row.label_en],
                [row.description, row.description_en],
              ]);
              return (
                <TR key={row.id}>
                  <TD className="tabular-nums">{row.sort_order}</TD>
                  <TD>
                    <Link
                      href={`/admin/forms/${row.id}`}
                      className="hover:underline underline-offset-2"
                    >
                      {row.label}
                    </Link>
                    {row.description && (
                      <p className="mt-0.5 text-[12px]" style={{ color: "var(--muted)" }}>
                        {row.description}
                      </p>
                    )}
                  </TD>
                  <TD className="text-[13px]">
                    {row.file_url ? (
                      // 直接連過去，讓系辦點一下就能確認上傳的是不是正確的檔案。
                      <a
                        href={row.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2"
                      >
                        {row.file_name ?? "檔案"} ↗︎
                      </a>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>（尚未上傳）</span>
                    )}
                  </TD>
                  <TD>
                    <EnBadge filled={en.filled} total={en.total} />
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/forms/${row.id}`}>
                        <Button variant="ghost" size="sm">
                          編輯
                        </Button>
                      </Link>
                      <DeleteButton
                        action={deleteCourseForm}
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
