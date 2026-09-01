import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsRoute } from "@/components/site/pages";
import { getNewsYears } from "@/lib/data";
import { NEWS_CATEGORIES, categoryForSlug, parseNewsYear } from "@/lib/news-categories";
import { NEWS_CATEGORY_PAGES } from "@/lib/i18n/news";

export const revalidate = 300;
export const dynamicParams = true;

/**
 * 每個分類 × 該分類實際有消息的年份。
 *
 * 用 `getNewsYears(category)` 而不是全站年份的笛卡兒積：求職徵才只有 23 則，
 * 大部分年份是空的，全積會預產出一堆註定 404 的頁。四次查詢換掉四十四次。
 */
export async function generateStaticParams() {
  const perCategory = await Promise.all(
    NEWS_CATEGORIES.map(async (c) => ({
      slug: c.slug,
      years: await getNewsYears(c.category),
    }))
  );
  return perCategory.flatMap(({ slug, years }) =>
    years.map(({ year }) => ({ slug, year: String(year) }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; year: string }>;
}): Promise<Metadata> {
  const { slug, year } = await params;
  const copy = NEWS_CATEGORY_PAGES[slug as keyof typeof NEWS_CATEGORY_PAGES];
  return { title: `${copy?.title.zh ?? "消息"}・${year}` };
}

/** 最新消息，依分類與年份篩選 */
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; year: string }>;
}) {
  const { slug, year } = await params;
  const category = categoryForSlug(slug);
  const n = parseNewsYear(year);
  if (!category || n === null) notFound();
  return <NewsRoute lang={"zh"} category={category} year={n} />;
}
