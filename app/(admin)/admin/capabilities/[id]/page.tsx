import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { CapabilityForm } from "../CapabilityForm";
import { updateCapability } from "../actions";

export const metadata: Metadata = { title: "編輯核心能力標籤" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  label: string;
  label_en: string | null;
  sort_order: number;
};

export default async function EditCapabilityPage({
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
    .from("capabilities")
    .select("id, label, label_en, sort_order")
    .eq("id", numericId)
    .maybeSingle<Row>();

  if (error) console.error("[admin/capabilities] load failed:", error.message);
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
          編輯核心能力標籤
        </h1>
        <Link
          href="/admissions#section-3"
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

      <CapabilityForm
        action={updateCapability}
        submitLabel="儲存變更"
        initial={{
          id: data.id,
          label: data.label,
          // null 轉空字串，讓 input 維持 uncontrolled。
          label_en: data.label_en ?? "",
          sort_order: data.sort_order,
        }}
      />
    </div>
  );
}
