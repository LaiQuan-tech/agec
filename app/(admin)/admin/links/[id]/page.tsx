import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { LinkForm } from "../LinkForm";
import { updateLink } from "../actions";
import { isEditableSection, sectionLabel, sectionPath } from "../constants";

export const metadata: Metadata = { title: "編輯連結卡片" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  section: string;
  label: string;
  label_en: string | null;
  url: string | null;
  sort_order: number;
};

export default async function EditLinkPage({
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
    .from("links")
    .select("id, section, label, label_en, url, sort_order")
    .eq("id", numericId)
    .maybeSingle<Row>();

  if (error) console.error("[admin/links] load failed:", error.message);
  if (!data) notFound();

  // A row from a retired section has no matching option in the dropdown, so the
  // select starts empty and the staff have to make a deliberate choice.
  const editable = isEditableSection(data.section);
  const publicPath = sectionPath(data.section);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
          編輯連結卡片
        </h1>
        {publicPath && (
          <Link
            href={publicPath}
            target="_blank"
            className="text-[13px] underline underline-offset-2"
            style={{ color: "var(--muted)" }}
          >
            在前台查看 ↗︎
          </Link>
        )}
      </header>

      {created === "1" && (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-800">
          已新增，前台已同步更新。
        </p>
      )}

      {!editable && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
          這筆資料屬於「{sectionLabel(data.section)}」區塊，前台已經沒有頁面會顯示它。
          按下儲存會把它移到你選的新區塊；如果不需要保留，直接回列表刪除即可。
        </p>
      )}

      <LinkForm
        action={updateLink}
        submitLabel="儲存變更"
        initial={{
          id: data.id,
          section: editable ? data.section : "",
          label: data.label,
          label_en: data.label_en ?? "",
          url: data.url ?? "",
          sort_order: data.sort_order,
        }}
      />
    </div>
  );
}
