import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { CapabilityForm } from "../CapabilityForm";
import { createCapability } from "../actions";

export const metadata: Metadata = { title: "新增核心能力標籤" };
export const dynamic = "force-dynamic";

export default async function NewCapabilityPage() {
  const { supabase } = await requireAdminOrRedirect();

  // 預設排到最後，與 /admin/links、/admin/faculty、/admin/programs 一致。
  // 給 0 的話每個新標籤都同分，而 getCapabilities() 只以這一欄排序，前台的
  // 順序就會變成 Postgres 高興怎麼回就怎麼排。
  const { data, error } = await supabase
    .from("capabilities")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_order: number }>();

  if (error) {
    console.error("[admin/capabilities] next sort_order lookup failed:", error.message);
  }
  const nextSortOrder = (data?.sort_order ?? 0) + 1;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
        新增核心能力標籤
      </h1>
      <CapabilityForm
        action={createCapability}
        submitLabel="新增"
        initial={{ label: "", label_en: "", sort_order: nextSortOrder }}
      />
    </div>
  );
}
