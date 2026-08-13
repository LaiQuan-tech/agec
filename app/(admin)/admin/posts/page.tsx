import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { Button } from "@/components/admin/ui/Button";
import { EmptyState, Table, TBody, TD, TH, THead, TR } from "@/components/admin/ui/Table";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { deletePost } from "./actions";
import { formatPublishedAt, POST_STATUS_LABELS, type PostStatus } from "./constants";

export const metadata: Metadata = { title: "部落格" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  slug: string;
  title: string;
  status: PostStatus;
  published_at: string | null;
};

export default async function PostsListPage() {
  const { supabase } = await requireAdminOrRedirect();

  // Newest first by creation, not by publication: drafts have no published_at,
  // and the row someone is still working on is the one they came back for.
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, status, published_at")
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

      {/*
        The blog exists in the database and in this admin section, but there is
        no /blog route on the public site yet. Saying so here is cheaper than
        letting the office staff discover it after publishing.
      */}
      <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
        前台的部落格頁面（/blog）尚未建置，文章即使設為「已發佈」目前也不會出現在官網上。
      </p>

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
            <TH className="w-[130px]">操作</TH>
          </THead>
          <TBody>
            {rows.map((row) => (
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
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
