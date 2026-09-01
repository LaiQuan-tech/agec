import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsRoute } from "@/components/site/pages";
import { getNewsPage, getNewsYears } from "@/lib/data";
import { parseNewsYear } from "@/lib/news-categories";

export const revalidate = 300;
export const dynamicParams = true;

/**
 * The full {year, page} product, built in this leaf rather than split across
 * the two dynamic segments — see node_modules/next/dist/docs/01-app/
 * 03-api-reference/04-functions/generate-static-params.md, "Multiple Dynamic
 * Segments".
 *
 * Pages 2..n only: page 1 is the sibling route.
 */
export async function generateStaticParams() {
  const years = await getNewsYears();
  const counts = await Promise.all(
    years.map(async ({ year }) => ({
      year,
      totalPages: (await getNewsPage(1, "zh", undefined, year)).totalPages,
    }))
  );
  return counts.flatMap(({ year, totalPages }) =>
    Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      year: String(year),
      page: String(i + 2),
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string; page: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  return { title: `${year} 年消息` };
}

/** 最新消息，依年份篩選，第 N 頁 */
export default async function Page({
  params,
}: {
  params: Promise<{ year: string; page: string }>;
}) {
  const { year, page } = await params;
  const y = parseNewsYear(year);
  const n = /^\d+$/.test(page) ? Number(page) : NaN;
  // Page 1 has its own URL; serving it here too would duplicate it.
  if (y === null || !Number.isSafeInteger(n) || n < 2) notFound();
  return <NewsRoute lang={"zh"} year={y} page={n} />;
}
