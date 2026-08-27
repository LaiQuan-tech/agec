import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsRoute } from "@/components/site/pages";
import { getNewsPage } from "@/lib/data";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;
export const dynamicParams = true;

/**
 * Pages 2..n. Page 1 is /news itself, so it is not in this list — rendering it
 * here as well would give the same content two URLs.
 */
export async function generateStaticParams() {
  const { totalPages } = await getNewsPage(1, "en");
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}

export const metadata: Metadata = routeMetadata("/news", "en");

/** 最新消息第 N 頁 (/news/page/[page]) —— 英文版，路徑加 /en 前綴 */
export default async function Page({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const n = /^\d+$/.test(page) ? Number(page) : NaN;
  // Page 1 has its own URL; serving it here too would duplicate it.
  if (!Number.isSafeInteger(n) || n < 2) notFound();
  return <NewsRoute lang="en" page={n} />;
}
