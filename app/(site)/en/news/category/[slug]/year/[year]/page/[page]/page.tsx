import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsRoute } from "@/components/site/pages";
import { categoryForSlug, parseNewsYear } from "@/lib/news-categories";
import { NEWS_CATEGORY_PAGES } from "@/lib/i18n/news";

export const revalidate = 300;
export const dynamicParams = true;

/**
 * 刻意回傳空陣列 —— 這一組全部在執行時才產生，之後由 ISR 快取。
 *
 * 文件明列這是「所有路徑在執行時產生」的做法（generate-static-params.md
 * §All paths at runtime：要走 ISR 就必須回空陣列或 force-static）。
 *
 * 為什麼不預產：4 個分類 × 11 個年份 = 44 組，要知道每一組有幾頁就得發 44 次
 * 查詢，而其中絕大多數只有一頁（分類切完再切年份，一年通常十幾則）—— 也就是
 * 說 44 次查詢換來的多半是零個頁面。第 2 頁以後是罕見網址，讓第一個訪客付一次
 * 算繪成本比較划算。
 */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; year: string; page: string }>;
}): Promise<Metadata> {
  const { slug, year } = await params;
  const copy = NEWS_CATEGORY_PAGES[slug as keyof typeof NEWS_CATEGORY_PAGES];
  return { title: `${copy?.title.en ?? "News"} · ${year}` };
}

/** 最新消息，依分類與年份篩選，第 N 頁 */
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; year: string; page: string }>;
}) {
  const { slug, year, page } = await params;
  const category = categoryForSlug(slug);
  const y = parseNewsYear(year);
  const n = /^\d+$/.test(page) ? Number(page) : NaN;
  if (!category || y === null || !Number.isSafeInteger(n) || n < 2) notFound();
  return <NewsRoute lang={"en"} category={category} year={y} page={n} />;
}
