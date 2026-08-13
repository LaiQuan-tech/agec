import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { Button } from "@/components/admin/ui/Button";
import { EmptyState, Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { deleteProgram } from "./actions";

export const metadata: Metadata = { title: "招生學制" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  name: string;
  name_en: string | null;
  description: string | null;
  sort_order: number;
};

/** Descriptions run to a paragraph; the full text is on the edit page. */
function summarize(text: string | null): string {
  if (!text) return "";
  return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}

export default async function ProgramsListPage() {
  const { supabase } = await requireAdminOrRedirect();

  // Same ordering as getPrograms(), so the row order here is the card order on
  // the public pages.
  const { data, error } = await supabase
    .from("programs")
    .select("id, name, name_en, description, sort_order")
    .order("sort_order", { ascending: true })
    .returns<Row[]>();

  if (error) {
    console.error("[admin/programs] list failed:", error.message);
  }
  const rows = data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
            招生學制
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
            這裡的異動會同時影響「首頁」與「招生資訊」頁，兩邊顯示的是同一份資料。
          </p>
        </div>
        <Link href="/admin/programs/new">
          <Button variant="primary">新增學制</Button>
        </Link>
      </header>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          讀取失敗，請重新整理。若持續發生請回報。
        </p>
      )}

      {rows.length === 0 && !error ? (
        <EmptyState
          message="目前沒有任何學制"
          action={
            <Link href="/admin/programs/new">
              <Button variant="primary" size="sm">
                新增第一個學制
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <THead>
            <TH className="w-[70px]">排序</TH>
            <TH className="w-[160px]">學制名稱</TH>
            <TH className="w-[200px]">英文名稱</TH>
            <TH>簡介</TH>
            <TH className="w-[130px]">操作</TH>
          </THead>
          <TBody>
            {rows.map((row) => (
              <TR key={row.id}>
                <TD className="tabular-nums">{row.sort_order}</TD>
                <TD>
                  <Link href={`/admin/programs/${row.id}`} className="hover:underline underline-offset-2">
                    {row.name}
                  </Link>
                </TD>
                <TD style={{ color: "var(--muted)" }}>{row.name_en ?? ""}</TD>
                <TD style={{ color: "var(--muted)" }}>{summarize(row.description)}</TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/programs/${row.id}`}>
                      <Button variant="ghost" size="sm">
                        編輯
                      </Button>
                    </Link>
                    <DeleteButton action={deleteProgram} id={row.id} itemLabel={row.name} />
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
