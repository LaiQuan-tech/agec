import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { ProgramForm } from "../ProgramForm";
import { createProgram } from "../actions";

export const metadata: Metadata = { title: "新增學制" };
export const dynamic = "force-dynamic";

export default async function NewProgramPage() {
  const { supabase } = await requireAdminOrRedirect();

  // Put a new program after the existing ones instead of tying with whatever
  // already sits at 0 — ties would order arbitrarily on the public pages.
  const { data, error } = await supabase
    .from("programs")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>();

  if (error) console.error("[admin/programs] next sort_order failed:", error.message);
  const nextSortOrder = (data?.sort_order ?? -1) + 1;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
        新增學制
      </h1>
      <ProgramForm
        action={createProgram}
        submitLabel="新增"
        initial={{ name: "", name_en: "", description: "", sort_order: nextSortOrder }}
      />
    </div>
  );
}
