import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { Button } from "@/components/admin/ui/Button";
import { EmptyState, Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EnBadge, enProgress } from "../_components/EnBadge";
import { deletePost } from "./actions";
import {
  formatPublishedAt,
  hasEditorContent,
  POST_STATUS_LABELS,
  type PostStatus,
} from "./constants";

export const metadata: Metadata = { title: "部落格" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  slug: string;
  title: string;
  title_en: string | null;
  excerpt: string | null;
  excerpt_en: string | null;
  content_html: string;
  content_html_en: string | null;
  author: string | null;
  author_en: string | null;
  status: PostStatus;
  published_at: string | null;
};

export default async function PostsListPage() {
  const { supabase } = await requireAdminOrRedirect();

  // Newest first by creation, not by publication: drafts have no published_at,
  // and the row someone is still working on is the one they came back for.
  //
  // Both 內文 columns are fetched for the 英文 badge alone, which needs to know
  // whether each body holds anything — and PostgREST cannot be asked for that
  // without a view to compute it. Fine at the handful of articles a year this
  // department writes; if the table ever grows enough for the list to drag, the
  // fix is a posts_admin_list view exposing the two flags, not dropping 內文
  // from the score and letting the badge claim a post is fully translated while
  // its body is still in Chinese.
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, slug, title, title_en, excerpt, excerpt_en, " +
        "content_html, content_html_en, author, author_en, status, published_at"
    )
    .order("created_at", { ascending: false })
    .returns<Row[]>();

  if (error) {
    console.error("[admin/posts] list failed:", error.message);
  }
  const rows = data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
            部落格
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
            有內文的長文章用這裡。只有一兩行的公告請改用「最新消息」。
          </p>
        </div>
        <Link href="/admin/posts/new">
          <Button variant="primary">新增文章</Button>
        </Link>
      </header>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          讀取失敗，請重新整理。若持續發生請回報。
        </p>
      )}

      {rows.length === 0 && !error ? (
        <EmptyState
          message="目前沒有任何文章"
          action={
            <Link href="/admin/posts/new">
              <Button variant="primary" size="sm">
                新增第一篇文章
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <THead>
            <TH className="w-[80px]">狀態</TH>
            <TH>標題</TH>
            <TH className="w-[180px]">網址代稱</TH>
            <TH className="w-[140px]">發佈時間</TH>
            <TH className="w-[80px]">英文</TH>
            <TH className="w-[130px]">操作</TH>
          </THead>
          <TBody>
            {rows.map((row) => {
              // 網址代稱 and 發佈時間 are language-neutral, and 標籤 is shared by
              // both sites on purpose (see PostForm), so these four pairs are
              // the whole translation job for a post.
              const en = enProgress([
                [row.title, row.title_en],
                [row.excerpt, row.excerpt_en],
                [row.author, row.author_en],
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
                  <TD>
                    <span
                      className="rounded px-1.5 py-0.5 text-[12px] whitespace-nowrap"
                      style={
                        row.status === "published"
                          ? { background: "var(--cream)", color: "var(--gold-deep)" }
                          : { background: "#f0f0ee", color: "var(--muted)" }
                      }
                    >
                      {POST_STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </TD>
                  <TD>
                    <Link href={`/admin/posts/${row.id}`} className="hover:underline underline-offset-2">
                      {row.title}
                    </Link>
                  </TD>
                  <TD className="truncate text-[13px]" style={{ color: "var(--muted)" }}>
                    {row.slug}
                  </TD>
                  <TD className="whitespace-nowrap tabular-nums">
                    {formatPublishedAt(row.published_at) || "—"}
                  </TD>
                  <TD>
                    <EnBadge filled={en.filled} total={en.total} />
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/posts/${row.id}`}>
                        <Button variant="ghost" size="sm">
                          編輯
                        </Button>
                      </Link>
                      <DeleteButton action={deletePost} id={row.id} itemLabel={row.title} />
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
