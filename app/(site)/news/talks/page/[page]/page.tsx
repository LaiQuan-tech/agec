import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TalksRoute } from "@/components/site/pages";
import { getTalksPage } from "@/lib/data";
import { NEWS } from "@/lib/i18n/news";

export const revalidate = 300;
export const dynamicParams = true;

/** Pages 2..n. Page 1 is /news/talks itself — see the note in the sibling. */
export async function generateStaticParams() {
  const { totalPages } = await getTalksPage(1, "zh");
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}

export const metadata: Metadata = { title: NEWS.talksArchiveTitle.zh };

/** 演講公告封存第 N 頁 */
export default async function Page({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const n = /^\d+$/.test(page) ? Number(page) : NaN;
  if (!Number.isSafeInteger(n) || n < 2) notFound();
  return <TalksRoute lang="zh" page={n} />;
}
