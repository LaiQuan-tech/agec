import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { Button } from "@/components/admin/ui/Button";
import { EmptyState, Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EnBadge, enProgress } from "../_components/EnBadge";
import { deleteNews } from "./actions";
import { NEWS_ADMIN_FILTERS, adminCategoryForSlug, hasEditorContent } from "./constants";
import { AppearsOn } from "../_components/AppearsOn";
import { FilterLink } from "../_components/FilterLink";

export const metadata: Metadata = { title: "最新消息" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  published_at: string;
  expires_at: string | null;
  category: string;
  category_en: string | null;
  title: string;
  title_en: string | null;
  body: string | null;
  body_en: string | null;
  content_html: string | null;
  content_html_en: string | null;
  is_pinned: boolean;
  status: string;
};

/** 台北時間的今天（YYYY-MM-DD）。與 lib/data.ts 的判斷同一個時區。 */
function todayInTaipei(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
}

export default async function NewsListPage({
  searchParams,
}: {
  // Next 16：searchParams 是 promise。`?category=` 是側欄「招生資訊 › 各學制
  // 招生頁 · 招生公告」帶進來的（slug，見 constants.ts 的 NEWS_ADMIN_FILTERS）。
  searchParams: Promise<{ category?: string }>;
}) {
  const { supabase } = await requireAdminOrRedirect();
  const { category: categoryParam } = await searchParams;
  const category = adminCategoryForSlug(categoryParam);
  const categorySlug = category ? categoryParam! : null;

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
  let query = supabase
    .from("news")
    .select(
      "id, published_at, expires_at, category, category_en, title, title_en, " +
        "body, body_en, content_html, content_html_en, is_pinned, status"
    )
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });
  if (category) query = query.eq("category", category);
  const { data, error } = await query.returns<Row[]>();

  if (error) {
    console.error("[admin/news] list failed:", error.message);
  }
  const rows = data ?? [];
  // 從篩好的列表按「新增」，分類就先選好 —— 招生公告是最常從側欄那個入口來的。
  const newHref = categorySlug ? `/admin/news/new?category=${categorySlug}` : "/admin/news/new";

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
            最新消息{category ? ` · ${category}` : ""}
          </h1>
          <AppearsOn pathname="/admin/news" filters={{ category: categorySlug }} />
          <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
            {/* 這裡原本寫「有內文的長文章請改用『部落格』」——部落格已於
                197a953 全站移除，最新消息現在就是唯一的發布管道，內文編輯器、
                封面圖與附件都在這一頁。 */}
            公告、演講、招生、徵才都發在這裡。可以放內文、封面圖與可下載的附件。
          </p>
        </div>
        <Link href={newHref}>
          <Button variant="primary">新增消息</Button>
        </Link>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="依分類篩選">
        <FilterLink label="全部" href="/admin/news" active={category === null} />
        {NEWS_ADMIN_FILTERS.map((f) => (
          <FilterLink
            key={f.slug}
            label={f.category}
            href={`/admin/news?category=${f.slug}`}
            active={categorySlug === f.slug}
          />
        ))}
      </nav>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          讀取失敗，請重新整理。若持續發生請回報。
        </p>
      )}

      {rows.length === 0 && !error ? (
        <EmptyState
          message={category ? `「${category}」目前沒有任何消息` : "目前沒有任何消息"}
          action={
            <Link href={newHref}>
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
            <TH className="w-[120px]">結束日期</TH>
            <TH className="w-[110px]">分類</TH>
            <TH>標題</TH>
            <TH className="w-[80px]">狀態</TH>
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
                  <TD className="whitespace-nowrap text-[13px]">
                    {/* 已經過期的列標出來。系辦最常問的是「這則為什麼在前台
                        看不到」—— 答案就在這一欄，而不是要他們回想設過什麼。
                        比較用字串：兩邊都是 YYYY-MM-DD 的台北日期。 */}
                    {row.expires_at ? (
                      <span
                        className="tabular-nums"
                        style={{
                          color:
                            row.expires_at.slice(0, 10) < todayInTaipei()
                              ? "var(--danger, #b91c1c)"
                              : "var(--ink)",
                        }}
                      >
                        {row.expires_at.slice(0, 10)}
                        {row.expires_at.slice(0, 10) < todayInTaipei() ? "（已結束）" : ""}
                      </span>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>—</span>
                    )}
                  </TD>
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
                  <TD>
                    {/* Only the draft state gets a badge. Published is the
                        ordinary case and marking all of them would leave a
                        column of identical labels for the eye to filter out
                        before finding the two that differ. */}
                    {row.status === "draft" ? (
                      <span
                        className="rounded px-1.5 py-0.5 text-[12px] font-medium"
                        style={{ background: "#fef3c7", color: "#92400e" }}
                      >
                        草稿
                      </span>
                    ) : (
                      <span className="text-[12px]" style={{ color: "var(--muted)" }}>
                        已發佈
                      </span>
                    )}
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
                        Unconditional: `news` has no future-dated publishing,
                        so every published row is already on the public site.
                        Chinese only — the /en twin lives on the edit
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
