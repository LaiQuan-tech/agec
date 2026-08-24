import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { Button } from "@/components/admin/ui/Button";
import { EmptyState, Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EnBadge, enProgress } from "../_components/EnBadge";
import { deleteNews } from "./actions";

export const metadata: Metadata = { title: "最新消息" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  published_at: string;
  category: string;
  category_en: string | null;
  title: string;
  title_en: string | null;
  is_pinned: boolean;
};

export default async function NewsListPage() {
  const { supabase } = await requireAdminOrRedirect();

  // Same ordering the public page uses, so what the staff see here matches the
  // site: pinned first, then newest.
  const { data, error } = await supabase
    .from("news")
    .select("id, published_at, category, category_en, title, title_en, is_pinned")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .returns<Row[]>();

  if (error) {
    console.error("[admin/news] list failed:", error.message);
  }
  const rows = data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
            最新消息
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
            短公告用這裡。有內文的長文章請改用「部落格」。
          </p>
        </div>
        <Link href="/admin/news/new">
          <Button variant="primary">新增消息</Button>
        </Link>
      </header>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          讀取失敗，請重新整理。若持續發生請回報。
        </p>
      )}

      {rows.length === 0 && !error ? (
        <EmptyState
          message="目前沒有任何消息"
          action={
            <Link href="/admin/news/new">
              <Button variant="primary" size="sm">
                新增第一則消息
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <THead>
            <TH className="w-[110px]">日期</TH>
            <TH className="w-[110px]">分類</TH>
            <TH>標題</TH>
            <TH className="w-[70px]">置頂</TH>
            <TH className="w-[80px]">英文</TH>
            <TH className="w-[130px]">操作</TH>
          </THead>
          <TBody>
            {rows.map((row) => {
              // 日期 and 置頂 are language-neutral; only these two translate.
              const en = enProgress([
                [row.title, row.title_en],
                [row.category, row.category_en],
              ]);

              return (
                <TR key={row.id}>
                  <TD className="whitespace-nowrap tabular-nums">{row.published_at.slice(0, 10)}</TD>
                  <TD>
                    <span
                      className="rounded px-1.5 py-0.5 text-[12px]"
                      style={{ background: "var(--cream)", color: "var(--gold-deep)" }}
                    >
                      {row.category}
                    </span>
                  </TD>
                  <TD>
                    <Link href={`/admin/news/${row.id}`} className="hover:underline underline-offset-2">
                      {row.title}
                    </Link>
                  </TD>
                  <TD>{row.is_pinned ? "是" : ""}</TD>
                  <TD>
                    <EnBadge filled={en.filled} total={en.total} />
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/news/${row.id}`}>
                        <Button variant="ghost" size="sm">
                          編輯
                        </Button>
                      </Link>
                      <DeleteButton action={deleteNews} id={row.id} itemLabel={row.title} />
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
