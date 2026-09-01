import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsRoute } from "@/components/site/pages";
import { getNewsYears } from "@/lib/data";
import { parseNewsYear } from "@/lib/news-categories";

export const revalidate = 300;

/**
 * `dynamicParams = true`，與分類頁的 `false`相反。
 *
 * 分類是四個寫死在程式裡的固定值，沒登記的 slug 就該 404。年份不是：它是資料
 * 推導出來的，而且每年一月一日就會多一個。若設成 false，跨年後系辦發的第一則
 * 消息會落在一個 404 的年份頁，直到有人重新部署為止 —— 那是只有跨年當下才會
 * 發生、而且沒人會想到要測的失效。
 *
 * 代價是任何四位數都會被接住，所以 `NewsRoute` 內有一道「這一年真的有消息嗎」
 * 的守門，沒有就 notFound()。
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getNewsYears()).map(({ year }) => ({ year: String(year) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  return { title: `News from ${year}` };
}

/** 最新消息，依年份篩選 */
export default async function Page({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const n = parseNewsYear(year);
  if (n === null) notFound();
  return <NewsRoute lang={"en"} year={n} />;
}
