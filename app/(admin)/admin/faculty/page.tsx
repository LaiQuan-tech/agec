import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { Button } from "@/components/admin/ui/Button";
import { EmptyState, Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { deleteFaculty } from "./actions";

export const metadata: Metadata = { title: "系所成員" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  name: string;
  title: string;
  category: string;
  fields: string | null;
  sort_order: number;
};

export default async function FacultyListPage() {
  const { supabase } = await requireAdminOrRedirect();

  // Same ordering the public page uses, so the staff see the rows in the order
  // visitors do. `id` breaks the ties that sort_order leaves, which keeps the
  // list from reshuffling between reloads.
  const { data, error } = await supabase
    .from("faculty")
    .select("id, name, title, category, fields, sort_order")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })
    .returns<Row[]>();

  if (error) {
    console.error("[admin/faculty] list failed:", error.message);
  }
  const rows = data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
            系所成員
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
            前台「系所成員」頁的名單，依顯示順序由小到大排列。
          </p>
        </div>
        <Link href="/admin/faculty/new">
          <Button variant="primary">新增成員</Button>
        </Link>
      </header>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          讀取失敗，請重新整理。若持續發生請回報。
        </p>
      )}

      {rows.length === 0 && !error ? (
        <EmptyState
          message="目前沒有任何成員"
          action={
            <Link href="/admin/faculty/new">
              <Button variant="primary" size="sm">
                新增第一位成員
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <THead>
            <TH className="w-[70px]">排序</TH>
            <TH className="w-[110px]">姓名</TH>
            <TH className="w-[110px]">職稱</TH>
            <TH className="w-[110px]">分類</TH>
            <TH>研究領域</TH>
            <TH className="w-[130px]">操作</TH>
          </THead>
          <TBody>
            {rows.map((row) => (
              <TR key={row.id}>
                <TD className="tabular-nums">{row.sort_order}</TD>
                <TD>
                  <Link href={`/admin/faculty/${row.id}`} className="hover:underline underline-offset-2">
                    {row.name}
                  </Link>
                </TD>
                <TD className="whitespace-nowrap">{row.title}</TD>
                <TD>
                  <span
                    className="rounded px-1.5 py-0.5 text-[12px]"
                    style={{ background: "var(--cream)", color: "var(--gold-deep)" }}
                  >
                    {row.category}
                  </span>
                </TD>
                <TD>
                  {/* Research fields run long; the full text is on the edit page,
                      so the cell shows a clipped single line with the rest in a
                      tooltip rather than stretching the table. */}
                  <span
                    className="block max-w-[260px] truncate"
                    title={row.fields ?? undefined}
                    style={{ color: "var(--muted)" }}
                  >
                    {row.fields ?? ""}
                  </span>
                </TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/faculty/${row.id}`}>
                      <Button variant="ghost" size="sm">
                        編輯
                      </Button>
                    </Link>
                    <DeleteButton action={deleteFaculty} id={row.id} itemLabel={row.name} />
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
