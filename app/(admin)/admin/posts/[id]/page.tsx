import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { PostForm } from "../PostForm";
import { updatePost } from "../actions";
import { toDatetimeLocalValue, type PostStatus } from "../constants";

export const metadata: Metadata = { title: "編輯文章" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  content_html: string;
  content_json: unknown;
  author: string | null;
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
    .select("id, slug, title, excerpt, cover_url, content_html, content_json, author, tags, status, published_at")
    .eq("id", numericId)
    .maybeSingle<Row>();

  if (error) console.error("[admin/posts] load failed:", error.message);
  if (!data) notFound();

  // No "view on the site" link here, unlike 最新消息: /blog does not exist yet,
  // and a link to a 404 would read as a bug in the post rather than a gap in
  // the public site.
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
        編輯文章
      </h1>

      {created === "1" && (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-800">
          已新增。
        </p>
      )}

      <PostForm
        action={updatePost}
        submitLabel="儲存變更"
        initial={{
          id: data.id,
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt ?? "",
          cover_url: data.cover_url ?? "",
          content_html: data.content_html ?? "",
          content_json: data.content_json ?? null,
          author: data.author ?? "",
          tags: (data.tags ?? []).join(", "),
          status: data.status,
          published_at: toDatetimeLocalValue(data.published_at),
        }}
      />
    </div>
  );
}
