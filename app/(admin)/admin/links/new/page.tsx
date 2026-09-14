import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { LinkForm } from "../LinkForm";
import { createLink } from "../actions";
import { isEditableSection, type EditableSection } from "../constants";

export const metadata: Metadata = { title: "新增連結卡片" };
export const dynamic = "force-dynamic";

export default async function NewLinkPage({
  searchParams,
}: {
  // 列表頁篩著哪一個區塊，「新增」就帶著它進來（`?section=admissions`），
  // 表單的「區塊」預選好，排序也接在那一區的最後。不在清單裡的值當 students。
  searchParams: Promise<{ section?: string }>;
}) {
  const { supabase } = await requireAdminOrRedirect();
  const { section: sectionParam } = await searchParams;
  const section: EditableSection =
    sectionParam && isEditableSection(sectionParam) ? sectionParam : "students";

  // Default to the end of that section's list, matching /admin/faculty and
  // /admin/programs. A plain 0 would give every new card the same sort_order,
  // and getLinks() only orders by that column — so the front-end order of the
  // tied cards would be whatever Postgres felt like returning.
  const { data, error } = await supabase
    .from("links")
    .select("sort_order")
    .eq("section", section)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>();

  if (error) console.error("[admin/links] next sort_order lookup failed:", error.message);
  const nextSortOrder = (data?.sort_order ?? 0) + 1;

  // 「學制」下拉的選項。與 /admissions 的學制卡讀同一張表，所以系辦改了學制
  // 名稱，這裡的選項會跟著改 —— 但已經存進 links.program 的舊字串不會自動
  // 跟著改（那是純文字、沒有 FK），所以表單保留了「已不在學制清單中」那一項。
  const { data: programRows, error: programError } = await supabase
    .from("programs")
    .select("name")
    .order("sort_order", { ascending: true })
    .returns<{ name: string }[]>();
  if (programError) {
    console.error("[admin/links] program list failed:", programError.message);
  }
  const programs = (programRows ?? []).map((p) => p.name);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
        新增連結卡片
      </h1>
      <LinkForm
        action={createLink}
        submitLabel="新增"
        initial={{ section, label: "", label_en: "", url: "", program: "", sort_order: nextSortOrder }}
        programs={programs}
      />
    </div>
  );
}
