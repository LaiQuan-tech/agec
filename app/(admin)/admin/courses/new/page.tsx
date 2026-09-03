import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { CourseForm } from "../CourseForm";
import { createCourse } from "../actions";
import { loadProgramNames } from "../programs";

export const metadata: Metadata = { title: "新增課程" };
export const dynamic = "force-dynamic";

export default async function NewCoursePage() {
  const { supabase } = await requireAdminOrRedirect();
  const programs = await loadProgramNames(supabase);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
        新增課程
      </h1>
      {/* Defaults match the table defaults: most rows are 3-credit 大學部 courses. */}
      <CourseForm
        action={createCourse}
        submitLabel="新增"
        programs={programs}
        initial={{
          code: "",
          name: "",
          name_en: "",
          credit: 3,
          ctype: "選修",
          ctype_en: "",
          program: "大學部",
        }}
      />
    </div>
  );
}
