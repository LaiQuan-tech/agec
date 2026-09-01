import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsRoute } from "@/components/site/pages";
import { NEWS_CATEGORIES, categoryForSlug } from "@/lib/news-categories";
import { NEWS_CATEGORY_PAGES } from "@/lib/i18n/news";

export const revalidate = 300;

/**
 * Only the registered slugs, and `dynamicParams = false` so nothing else
 * resolves.
 *
 * The list comes from the table, not from the database: a new category needs a
 * slug, a pair of tab labels and a page heading, all of which are code. Failing
 * the build's static params is something you see before deploying; a live page
 * with no title is not.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return NEWS_CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const copy = NEWS_CATEGORY_PAGES[slug as keyof typeof NEWS_CATEGORY_PAGES];
  return { title: copy?.title.en };
}

/** 最新消息，依分類篩選 */
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categoryForSlug(slug);
  if (!category) notFound();
  return <NewsRoute lang="en" category={category} />;
}
