import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { Button } from "@/components/admin/ui/Button";
import { EmptyState, Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { isEditableSection, sectionLabel } from "./constants";
import { deleteLink } from "./actions";

export const metadata: Metadata = { title: "連結卡片" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  section: string;
  label: string;
  url: string | null;
  sort_order: number;
};

export default async function LinksListPage() {
  const { supabase } = await requireAdminOrRedirect();

  // Grouped by section, then in display order — the same order the two public
  // pages use, with the sections stacked so related cards stay together.
  //
  // Retired sections are listed too, not filtered out: rows left over from the
  // 農經期刊 era are invisible on the site and the staff can only clear them if
  // they can see them here.
  const { data, error } = await supabase
    .from("links")
    .select("id, section, label, url, sort_order")
    .order("section", { ascending: true })
    .order("sort_order", { ascending: true })
    .returns<Row[]>();

  if (error) {
    console.error("[admin/links] list failed:", error.message);
  }
  const rows = data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
            連結卡片
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
            「學生專區」與「系友專區」兩頁上的卡片。
          </p>
        </div>
        <Link href="/admin/links/new">
          <Button variant="primary">新增卡片</Button>
        </Link>
      </header>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          讀取失敗，請重新整理。若持續發生請回報。
        </p>
      )}

      {rows.length === 0 && !error ? (
        <EmptyState
          message="目前沒有任何連結卡片"
          action={
            <Link href="/admin/links/new">
              <Button variant="primary" size="sm">
                新增第一張卡片
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <THead>
            <TH className="w-[140px]">區塊</TH>
            <TH className="w-[70px]">排序</TH>
            <TH>卡片文字</TH>
            <TH>連結</TH>
            <TH className="w-[130px]">操作</TH>
          </THead>
          <TBody>
            {rows.map((row) => {
              const retired = !isEditableSection(row.section);
              // Matches the public card: '#' and null both render as plain text.
              const isPlainCard = !row.url || row.url === "#";

              return (
                <TR key={row.id}>
                  <TD>
                    <span
                      className="rounded px-1.5 py-0.5 text-[12px]"
                      style={
                        retired
                          ? { background: "var(--hairline)", color: "var(--muted)" }
                          : { background: "var(--cream)", color: "var(--gold-deep)" }
                      }
                    >
                      {sectionLabel(row.section)}
                    </span>
                  </TD>
                  <TD className="tabular-nums">{row.sort_order}</TD>
                  <TD>
                    <Link href={`/admin/links/${row.id}`} className="hover:underline underline-offset-2">
                      {row.label}
                    </Link>
                  </TD>
                  <TD>
                    {isPlainCard ? (
                      <span className="text-[13px]" style={{ color: "var(--muted)" }}>
                        （純文字卡片）
                      </span>
                    ) : (
                      <span className="block max-w-[280px] truncate text-[13px]" title={row.url!}>
                        {row.url}
                      </span>
                    )}
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/links/${row.id}`}>
                        <Button variant="ghost" size="sm">
                          編輯
                        </Button>
                      </Link>
                      <DeleteButton action={deleteLink} id={row.id} itemLabel={row.label} />
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
