import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { CourseForm } from "../CourseForm";
import { updateCourse } from "../actions";

export const metadata: Metadata = { title: "編輯課程" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  code: string;
  name: string;
  credit: number;
  ctype: string;
  program: string;
};

export default async function EditCoursePage({
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
    .from("courses")
    .select("id, code, name, credit, ctype, program")
    .eq("id", numericId)
    .maybeSingle<Row>();

  if (error) console.error("[admin/courses] load failed:", error.message);
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
          編輯課程
        </h1>
        <Link
          href="/courses"
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

      <CourseForm
        action={updateCourse}
        submitLabel="儲存變更"
        initial={{
          id: data.id,
          code: data.code,
          name: data.name,
          credit: data.credit,
          ctype: data.ctype,
          program: data.program,
        }}
      />
    </div>
  );
}
