import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { Button } from "@/components/admin/ui/Button";
import { EmptyState, Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EnBadge, enProgress } from "../_components/EnBadge";
import { deleteNews } from "./actions";
import { hasEditorContent } from "./constants";

export const metadata: Metadata = { title: "最新消息" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  published_at: string;
  category: string;
  category_en: string | null;
  title: string;
  title_en: string | null;
  body: string | null;
  body_en: string | null;
  content_html: string | null;
  content_html_en: string | null;
  is_pinned: boolean;
};

export default async function NewsListPage() {
  const { supabase } = await requireAdminOrRedirect();

  // Same ordering the public page uses, so what the staff see here matches the
  // site: pinned first, then newest.
  //
  // Both 內文 columns are fetched for the 英文 badge alone, which needs to know
  // whether each body holds anything — and PostgREST cannot be asked for that
  // without a view to compute it. Fine at the dozen-odd announcements a year
  // this department posts; if the table ever grows enough for the list to drag,
  // the fix is a news_admin_list view exposing the two flags, not dropping 內文
  // from the score and letting the badge call a row fully translated while its
  // body is still in Chinese.
  const { data, error } = await supabase
    .from("news")
    .select(
      "id, published_at, category, category_en, title, title_en, " +
        "body, body_en, content_html, content_html_en, is_pinned"
    )
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
            <TH className="w-[190px]">操作</TH>
          </THead>
          <TBody>
            {rows.map((row) => {
              // 日期 and 置頂 are language-neutral, so these four pairs are the
              // whole translation job for an announcement.
              const en = enProgress([
                [row.title, row.title_en],
                [row.category, row.category_en],
                [row.body, row.body_en],
                // enProgress decides "empty" by trimming, and "<p></p>" — what
                // the editor leaves behind for a body someone opened and then
                // cleared — survives a trim. hasEditorContent() is the same
                // test actions.ts applies before storing, so the badge and the
                // database agree on what counts as written.
                [
                  hasEditorContent(row.content_html) ? row.content_html : null,
                  hasEditorContent(row.content_html_en) ? row.content_html_en : null,
                ],
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
                      {/*
                        Unconditional, unlike the blog's: `news` has no `status`
                        column and no future-dated publishing, so every row here
                        is already on the public site and /news/[id] can never
                        404 on one. Chinese only — the /en twin lives on the edit
                        page, where someone is actually translating and has a
                        reason to look at it; two ↗︎ links per row would crowd out
                        the two buttons that do the work.
                      */}
                      <Link href={`/news/${row.id}`} target="_blank">
                        <Button variant="ghost" size="sm" title="在新分頁開啟前台的這則消息">
                          前台 ↗︎
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
