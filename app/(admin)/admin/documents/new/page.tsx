import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { DocumentForm } from "../DocumentForm";
import { createDocument } from "../actions";
import { loadDocumentFormOptions } from "../options";
import { DOCUMENT_SECTIONS, type DocumentSection } from "../constants";

export const metadata: Metadata = { title: "新增檔案" };
export const dynamic = "force-dynamic";

export default async function NewDocumentPage({
  searchParams,
}: {
  // 列表頁篩著哪一個區塊，「新增」就帶著它進來（`?section=admissions`）。
  searchParams: Promise<{ section?: string }>;
}) {
  const { supabase } = await requireAdminOrRedirect();
  const { section: sectionParam } = await searchParams;
  // 預設課程資訊：既有的用法是系上表單，招生檔案是後來加的。
  const section: DocumentSection =
    sectionParam && (DOCUMENT_SECTIONS as readonly string[]).includes(sectionParam)
      ? (sectionParam as DocumentSection)
      : "courses";

  // 預設排到該區塊的最後，與 /admin/links 一致。給 0 的話每一筆都同分，而
  // getDocuments() 只以這一欄（加 id）排序。
  const { data, error } = await supabase
    .from("documents")
    .select("sort_order")
    .eq("section", section)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>();

  if (error) {
    console.error("[admin/documents] next sort_order lookup failed:", error.message);
  }
  const nextSortOrder = (data?.sort_order ?? 0) + 1;

  const { categories, programs } = await loadDocumentFormOptions(supabase);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
        新增檔案
      </h1>
      <DocumentForm
        action={createDocument}
        submitLabel="新增"
        categories={categories}
        programs={programs}
        initial={{
          section,
          category: "",
          category_en: "",
          program: "",
          label: "",
          label_en: "",
          description: "",
          description_en: "",
          file_url: "",
          file_name: "",
          sort_order: nextSortOrder,
        }}
      />
    </div>
  );
}
