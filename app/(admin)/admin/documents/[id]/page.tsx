import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { DocumentForm } from "../DocumentForm";
import { updateDocument } from "../actions";
import { documentSectionPath } from "../constants";
import { loadDocumentFormOptions } from "../options";

export const metadata: Metadata = { title: "編輯檔案" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  section: string;
  category: string | null;
  category_en: string | null;
  program: string | null;
  label: string;
  label_en: string | null;
  description: string | null;
  description_en: string | null;
  file_url: string | null;
  file_name: string | null;
  sort_order: number;
};

export default async function EditDocumentPage({
  params,
  searchParams,
}: {
  // Next 16：兩個都是 promise。
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { supabase } = await requireAdminOrRedirect();
  const { id } = await params;
  const { created } = await searchParams;

  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const { data, error } = await supabase
    .from("documents")
    // 🔴 update() 是整列覆寫：這裡少讀一個欄位，「打開再儲存」就會把它清掉。
    //    parse() 產出的每一個 key 都要在這裡。
    .select(
      "id, section, category, category_en, program, label, label_en, description, description_en, file_url, file_name, sort_order"
    )
    .eq("id", numericId)
    .maybeSingle<Row>();

  if (error) console.error("[admin/documents] load failed:", error.message);
  if (!data) notFound();

  const { categories, programs } = await loadDocumentFormOptions(supabase);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
          編輯檔案
        </h1>
        <Link
          href={documentSectionPath(data.section)}
          target="_blank"
          className="text-[13px] underline underline-offset-2"
          style={{ color: "var(--muted)" }}
        >
          在前台查看 ↗︎
        </Link>
      </header>

      {created === "1" && (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-800">
          已新增，前台已同步更新。
        </p>
      )}

      <DocumentForm
        action={updateDocument}
        submitLabel="儲存變更"
        categories={categories}
        programs={programs}
        initial={{
          id: data.id,
          section: data.section,
          category: data.category ?? "",
          category_en: data.category_en ?? "",
          program: data.program ?? "",
          label: data.label,
          // null 轉空字串，讓 input 維持 uncontrolled。
          label_en: data.label_en ?? "",
          description: data.description ?? "",
          description_en: data.description_en ?? "",
          file_url: data.file_url ?? "",
          file_name: data.file_name ?? "",
          sort_order: data.sort_order,
        }}
      />
    </div>
  );
}
