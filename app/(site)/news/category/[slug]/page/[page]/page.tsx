import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsRoute } from "@/components/site/pages";
import { getNewsPage } from "@/lib/data";
import { NEWS_CATEGORIES, categoryForSlug } from "@/lib/news-categories";
import { NEWS_CATEGORY_PAGES } from "@/lib/i18n/news";

export const revalidate = 300;

/**
 * `dynamicParams = true`, unlike the sibling that renders page 1: the slugs are
 * a closed set but the page count is not, so page N+1 should appear when the
 * office publishes into a category rather than at the next build. Same choice
 * as /news/page/[page] and /news/talks/page/[page].
 */
export const dynamicParams = true;

/**
 * The full {slug, page} product, built in this leaf rather than split across
 * the two dynamic segments — see node_modules/next/dist/docs/01-app/
 * 03-api-reference/04-functions/generate-static-params.md, "Multiple Dynamic
 * Segments".
 *
 * Pages 2..n only: page 1 is the sibling route, and generating it here as well
 * would give the same content two URLs.
 */
export async function generateStaticParams() {
  const counts = await Promise.all(
    NEWS_CATEGORIES.map(async (c) => ({
      slug: c.slug,
      totalPages: (await getNewsPage(1, "zh", c.category)).totalPages,
    }))
  );
  return counts.flatMap(({ slug, totalPages }) =>
    Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      slug,
      page: String(i + 2),
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const copy = NEWS_CATEGORY_PAGES[slug as keyof typeof NEWS_CATEGORY_PAGES];
  return { title: copy?.title.zh };
}

/** 最新消息，依分類篩選，第 N 頁 */
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const { slug, page } = await params;
  const category = categoryForSlug(slug);
  const n = /^\d+$/.test(page) ? Number(page) : NaN;
  // Page 1 has its own URL; serving it here too would duplicate it.
  if (!category || !Number.isSafeInteger(n) || n < 2) notFound();
  return <NewsRoute lang="zh" category={category} page={n} />;
}
