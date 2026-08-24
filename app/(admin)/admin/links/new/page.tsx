import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { LinkForm } from "../LinkForm";
import { createLink } from "../actions";

export const metadata: Metadata = { title: "新增連結卡片" };
export const dynamic = "force-dynamic";

export default async function NewLinkPage() {
  const { supabase } = await requireAdminOrRedirect();

  // Default to the end of the 學生專區 list, matching /admin/faculty and
  // /admin/programs. A plain 0 would give every new card the same sort_order,
  // and getLinks() only orders by that column — so the front-end order of the
  // tied cards would be whatever Postgres felt like returning.
  const { data, error } = await supabase
    .from("links")
    .select("sort_order")
    .eq("section", "students")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>();

  if (error) console.error("[admin/links] next sort_order lookup failed:", error.message);
  const nextSortOrder = (data?.sort_order ?? 0) + 1;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
        新增連結卡片
      </h1>
      <LinkForm
        action={createLink}
        submitLabel="新增"
        initial={{ section: "students", label: "", label_en: "", url: "", sort_order: nextSortOrder }}
      />
    </div>
  );
}
