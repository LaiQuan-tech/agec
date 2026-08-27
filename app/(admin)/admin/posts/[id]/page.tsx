import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { localizePath } from "@/lib/i18n";
import { PostForm } from "../PostForm";
import { updatePost } from "../actions";
import { isPostLive, toDatetimeLocalValue, type PostStatus } from "../constants";

export const metadata: Metadata = { title: "編輯文章" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  slug: string;
  title: string;
  title_en: string | null;
  excerpt: string | null;
  excerpt_en: string | null;
  cover_url: string | null;
  content_html: string;
  content_json: unknown;
  content_html_en: string | null;
  content_json_en: unknown;
  author: string | null;
  author_en: string | null;
  tags: string[] | null;
  status: PostStatus;
  published_at: string | null;
};

export default async function EditPostPage({
  params,
  searchParams,
}: {
  // Next 16: both are promises.
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { supabase } = await requireAdminOrRedirect();
  const { id } = await params;
  const { created } = await searchParams;

  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, slug, title, title_en, excerpt, excerpt_en, cover_url, " +
        "content_html, content_json, content_html_en, content_json_en, " +
        "author, author_en, tags, status, published_at"
    )
    .eq("id", numericId)
    .maybeSingle<Row>();

  if (error) console.error("[admin/posts] load failed:", error.message);
  if (!data) notFound();

  // Two links where 最新消息 has one: a post gets a page of its own in each
  // language, and /en/blog is the half nobody on staff would otherwise open —
  // which is exactly the half where a missing translation shows.
  //
  // Only when the page is actually there to be looked at. isPostLive() holds
  // the rule — a draft 404s, and so does a post that is 已發佈 but scheduled for
  // later — so the admin and lib/data.ts cannot drift apart on what "live"
  // means. This page is force-dynamic, so the answer is recomputed per request.
  //
  // The slug needs no escaping: posts_slug_format restricts it to lowercase
  // letters, digits and hyphens.
  const publicPath = `/blog/${data.slug}`;
  const isLive = isPostLive(data.status, data.published_at);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
          編輯文章
        </h1>
        {isLive && (
          <span className="flex flex-wrap items-baseline gap-3">
            <Link
              href={publicPath}
              target="_blank"
              className="text-[13px] underline underline-offset-2"
              style={{ color: "var(--muted)" }}
            >
              在前台查看 ↗
            </Link>
            <Link
              href={localizePath(publicPath, "en")}
              target="_blank"
              className="text-[13px] underline underline-offset-2"
              style={{ color: "var(--muted)" }}
            >
              英文版 ↗
            </Link>
          </span>
        )}
      </header>

      {created === "1" && (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-800">
          已新增，前台已同步更新。
        </p>
      )}

      <PostForm
        action={updatePost}
        submitLabel="儲存變更"
        initial={{
          id: data.id,
          slug: data.slug,
          title: data.title,
          title_en: data.title_en ?? "",
          excerpt: data.excerpt ?? "",
          excerpt_en: data.excerpt_en ?? "",
          cover_url: data.cover_url ?? "",
          content_html: data.content_html ?? "",
          content_json: data.content_json ?? null,
          content_html_en: data.content_html_en ?? "",
          content_json_en: data.content_json_en ?? null,
          author: data.author ?? "",
          author_en: data.author_en ?? "",
          tags: (data.tags ?? []).join(", "),
          status: data.status,
          published_at: toDatetimeLocalValue(data.published_at),
        }}
      />
    </div>
  );
}
