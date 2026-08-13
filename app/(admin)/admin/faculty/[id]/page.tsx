import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { FacultyForm } from "../FacultyForm";
import { updateFaculty } from "../actions";

export const metadata: Metadata = { title: "編輯成員" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  name: string;
  title: string;
  category: string;
  fields: string | null;
  photo_url: string | null;
  sort_order: number;
};

export default async function EditFacultyPage({
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
    .from("faculty")
    .select("id, name, title, category, fields, photo_url, sort_order")
    .eq("id", numericId)
    .maybeSingle<Row>();

  if (error) console.error("[admin/faculty] load failed:", error.message);
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
          編輯成員
        </h1>
        <Link
          href="/faculty"
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

      <FacultyForm
        action={updateFaculty}
        submitLabel="儲存變更"
        initial={{
          id: data.id,
          name: data.name,
          title: data.title,
          category: data.category,
          fields: data.fields ?? "",
          photo_url: data.photo_url ?? "",
          sort_order: data.sort_order,
        }}
      />
    </div>
  );
}
