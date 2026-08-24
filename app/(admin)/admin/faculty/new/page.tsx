import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { FacultyForm } from "../FacultyForm";
import { createFaculty } from "../actions";

export const metadata: Metadata = { title: "新增成員" };
export const dynamic = "force-dynamic";

export default async function NewFacultyPage() {
  const { supabase } = await requireAdminOrRedirect();

  // Default to the end of the list. A plain 0 would drop every new member above
  // people whose order the office has already arranged by hand.
  const { data, error } = await supabase
    .from("faculty")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>();

  if (error) console.error("[admin/faculty] next sort_order lookup failed:", error.message);
  const nextSortOrder = (data?.sort_order ?? 0) + 1;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
        新增成員
      </h1>
      <FacultyForm
        action={createFaculty}
        submitLabel="新增"
        initial={{
          name: "",
          name_en: "",
          title: "",
          title_en: "",
          category: "專任師資",
          fields: "",
          fields_en: "",
          // No Chinese 經歷 input exists, so a brand-new person never has one to
          // translate — FacultyForm hides the English box on an empty value.
          experience: "",
          experience_en: "",
          photo_url: "",
          sort_order: nextSortOrder,
        }}
      />
    </div>
  );
}
