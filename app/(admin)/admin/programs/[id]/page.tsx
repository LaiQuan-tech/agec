import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/admin/auth";
import { ProgramForm } from "../ProgramForm";
import { updateProgram } from "../actions";

export const metadata: Metadata = { title: "編輯學制" };
export const dynamic = "force-dynamic";

type Row = {
  id: number;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  admission_url: string | null;
  requirements_html: string | null;
  requirements_html_en: string | null;
  requirements_json: unknown;
  requirements_json_en: unknown;
  sort_order: number;
};

export default async function EditProgramPage({
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
    .from("programs")
    // 🔴 requirements_* 四欄**必須**在這裡被選出來。updateProgram 是
    //    `.update(values)` 全欄覆寫，表單送出什麼就寫什麼 —— 少選一欄，
    //    initial 就是空字串，parse() 把空字串轉成 null，於是「打開來看一下
    //    再按儲存」會把整份修業規定清掉，而且沒有任何錯誤訊息。
    .select(
      "id, name, name_en, description, description_en, admission_url, requirements_html, requirements_html_en, requirements_json, requirements_json_en, sort_order"
    )
    .eq("id", numericId)
    .maybeSingle<Row>();

  if (error) console.error("[admin/programs] load failed:", error.message);
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] font-bold" style={{ color: "var(--brand-green)" }}>
          編輯學制
        </h1>
        <Link
          href="/admissions"
          target="_blank"
          className="text-[13px] underline underline-offset-2"
          style={{ color: "var(--muted)" }}
        >
          在前台查看 ↗︎
        </Link>
      </header>

      {created === "1" && (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[13px] text-green-800">
          已新增，首頁與招生資訊頁已同步更新。
        </p>
      )}

      <ProgramForm
        action={updateProgram}
        submitLabel="儲存變更"
        initial={{
          id: data.id,
          name: data.name,
          name_en: data.name_en ?? "",
          description: data.description ?? "",
          description_en: data.description_en ?? "",
          // null 轉空字串，讓 input 維持 uncontrolled。
          admission_url: data.admission_url ?? "",
          requirements_html: data.requirements_html ?? "",
          requirements_html_en: data.requirements_html_en ?? "",
          requirements_json: data.requirements_json ?? null,
          requirements_json_en: data.requirements_json_en ?? null,
          sort_order: data.sort_order,
        }}
      />
    </div>
  );
}
