import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProgramAdmissions } from "@/components/site/ProgramAdmissions";
import {
  getAdmissionsNews,
  getDocumentsForProgram,
  getLinksForProgram,
  getPrograms,
} from "@/lib/data";
import { PROGRAM_SLUG_LIST, programForSlug } from "@/lib/program-slugs";
import { articleMetadata } from "@/lib/site-routes";
import { ADMISSIONS } from "@/lib/i18n/admissions";

/**
 * 各學制的招生頁（舊站 recruit1–4 的對應）。
 *
 * 形狀照 app/(site)/courses/[program]/page.tsx：代稱白名單 → 查資料 → 404。
 * 差別是**四頁一定存在**（每個學制都有招生公告可以列），不像修業規定頁要
 * 有內文才有頁；所以 generateStaticParams 直接列四個代稱。
 */

export const revalidate = 300;
/** 系辦新增招生消息或標學制之後，那一頁要立刻反映 —— 由 revalidateFor 處理。 */
export const dynamicParams = true;

export async function generateStaticParams() {
  return PROGRAM_SLUG_LIST.map((program) => ({ program }));
}

async function load(slug: string) {
  const nameZh = programForSlug(slug);
  if (!nameZh) return null;
  const programs = await getPrograms("zh");
  const program = programs.find((p) => p.name_zh === nameZh);
  if (!program) return null;
  return { nameZh, program, programs };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ program: string }>;
}): Promise<Metadata> {
  const { program: slug } = await params;
  const loaded = await load(slug);
  if (!loaded) notFound();

  const copy = ADMISSIONS.programs.find((entry) => entry.match === loaded.nameZh);
  return articleMetadata(`/admissions/${slug}`, "zh", {
    title: `${loaded.program.name}${ADMISSIONS.programPage.titleSuffix.zh}`,
    excerpt: copy?.tagline.zh ?? loaded.program.description,
    cover_url: null,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program: slug } = await params;
  // 網址上那一段是任意字串。先過白名單，不在四個代稱裡就 404 ——
  // 這一步也保證了永遠不會有使用者輸入的值被送進資料庫查詢。
  const loaded = await load(slug);
  if (!loaded) notFound();
  const { nameZh, program, programs } = loaded;

  const [notices, documents, links] = await Promise.all([
    getAdmissionsNews(nameZh, "zh"),
    getDocumentsForProgram("admissions", nameZh, "zh"),
    getLinksForProgram("admissions", nameZh, "zh"),
  ]);

  return (
    <ProgramAdmissions
      lang="zh"
      program={program}
      programs={programs}
      notices={notices}
      documents={documents}
      links={links}
    />
  );
}
