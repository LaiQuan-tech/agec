import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { NewsForm } from "../NewsForm";
import { updateNews } from "../actions";

export const metadata: Metadata = { title: "編輯消息" };
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

export default async function EditNewsPage({
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
    .from("news")
    .select("id, published_at, category, category_en, title, title_en, is_pinned")
    .eq("id", numericId)
    .maybeSingle<Row>();

  if (error) console.error("[admin/news] load failed:", error.message);
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
          編輯消息
        </h1>
        <Link
          href="/news"
          target="_blank"
          className="text-[13px] underline underline-offset-2"
          style={{ color: "var(--muted)" }}
        >
          在前台查看 ↗
        </Link>
      </header>

      {created === "1" && (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-800">
          已新增，前台已同步更新。
        </p>
      )}

      <NewsForm
        action={updateNews}
        submitLabel="儲存變更"
        initial={{
          id: data.id,
          published_at: data.published_at.slice(0, 10),
          category: data.category,
          category_en: data.category_en ?? "",
          title: data.title,
          title_en: data.title_en ?? "",
          is_pinned: data.is_pinned,
        }}
      />
    </div>
  );
}
