import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProgramRequirements } from "@/components/site/ProgramRequirements";
import { getProgramByName, getProgramsWithRequirements } from "@/lib/data";
import { programForSlug, slugForProgram } from "@/lib/program-slugs";
import { articleMetadata } from "@/lib/site-routes";
import { COURSES } from "@/lib/i18n/courses";

/** 見 app/(site)/courses/[program]/page.tsx —— 這是它的英文孿生。 */

export const revalidate = 300;

/**
 * ⚠️ true，不是 false。系辦改完修業規定之後那一頁必須立刻能開 —— false 的話
 * 要等下一次 build。代價是任何字串都會被路由接住，所以下面先用
 * programForSlug() 的白名單擋一次，再由 getProgramByName() 對「沒有內文」回
 * null，兩種情況一律 404。
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  const names = await getProgramsWithRequirements();
  return names
    .map((name) => slugForProgram(name))
    .filter((slug): slug is string => Boolean(slug))
    .map((program) => ({ program }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ program: string }>;
}): Promise<Metadata> {
  const { program: slug } = await params;
  const nameZh = programForSlug(slug);
  const program = nameZh ? await getProgramByName(nameZh, "en") : null;
  if (!program) notFound();

  return articleMetadata(`/courses/${slug}`, "en", {
    title: `${program.name} · ${COURSES.requirements.label.en}`,
    // 摘要用學制自己的簡介 —— 搜尋結果裡那是最能分辨四個學制的一行。
    excerpt: program.description,
    cover_url: null,
  });
}

/** 單一學制的修業規定 (/courses/[program]) */
export default async function Page({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program: slug } = await params;
  // 網址上那一段是任意字串。先過白名單，不在四個代稱裡就 404 ——
  // 這一步也保證了永遠不會有使用者輸入的值被送進資料庫查詢。
  const nameZh = programForSlug(slug);
  if (!nameZh) notFound();

  const program = await getProgramByName(nameZh, "en");
  if (!program) notFound();

  return <ProgramRequirements lang="en" program={program} />;
}
