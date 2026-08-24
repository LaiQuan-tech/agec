import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { Button } from "@/components/admin/ui/Button";
import { EmptyState, Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EnBadge, enProgress } from "../_components/EnBadge";
import { deleteCourse } from "./actions";

export const metadata: Metadata = { title: "課程資訊" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  code: string;
  name: string;
  name_en: string | null;
  credit: number;
  ctype: string;
  ctype_en: string | null;
  program: string;
};

export default async function CoursesListPage() {
  const { supabase } = await requireAdminOrRedirect();

  // Same ordering getCourses() uses, so the rows here appear in the order the
  // public /courses tabs and tables show them.
  const { data, error } = await supabase
    .from("courses")
    .select("id, code, name, name_en, credit, ctype, ctype_en, program")
    .order("program", { ascending: true })
    .order("code", { ascending: true })
    .returns<Row[]>();

  if (error) {
    console.error("[admin/courses] list failed:", error.message);
  }
  const rows = data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
            課程資訊
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
            前台會依「學制」自動分頁，同一學制內再依課號排序。
          </p>
        </div>
        <Link href="/admin/courses/new">
          <Button variant="primary">新增課程</Button>
        </Link>
      </header>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          讀取失敗，請重新整理。若持續發生請回報。
        </p>
      )}

      {rows.length === 0 && !error ? (
        <EmptyState
          message="目前沒有任何課程"
          action={
            <Link href="/admin/courses/new">
              <Button variant="primary" size="sm">
                新增第一門課程
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <THead>
            <TH className="w-[120px]">學制</TH>
            <TH className="w-[110px]">課號</TH>
            <TH>課程名稱</TH>
            <TH className="w-[70px]">學分</TH>
            <TH className="w-[80px]">類型</TH>
            <TH className="w-[80px]">英文</TH>
            <TH className="w-[130px]">操作</TH>
          </THead>
          <TBody>
            {rows.map((row) => {
              // 學制 is excluded on purpose: it stays Chinese as the matching key
              // into programs.name, and its English label lives on that table.
              const en = enProgress([
                [row.name, row.name_en],
                [row.ctype, row.ctype_en],
              ]);

              return (
                <TR key={row.id}>
                  <TD>
                    <span
                      className="rounded px-1.5 py-0.5 text-[12px]"
                      style={{ background: "var(--cream)", color: "var(--gold-deep)" }}
                    >
                      {row.program}
                    </span>
                  </TD>
                  <TD className="whitespace-nowrap tabular-nums">{row.code}</TD>
                  <TD>
                    <Link href={`/admin/courses/${row.id}`} className="hover:underline underline-offset-2">
                      {row.name}
                    </Link>
                  </TD>
                  <TD className="tabular-nums">{row.credit}</TD>
                  <TD>{row.ctype}</TD>
                  <TD>
                    <EnBadge filled={en.filled} total={en.total} />
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/courses/${row.id}`}>
                        <Button variant="ghost" size="sm">
                          編輯
                        </Button>
                      </Link>
                      <DeleteButton action={deleteCourse} id={row.id} itemLabel={row.name} />
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}
