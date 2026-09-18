import type { Metadata } from "next";
import { SearchPage } from "@/components/site/SearchPage";
import { search } from "@/lib/search";
import { SITE_NAME } from "@/lib/site-routes";

/** 見 app/(site)/search/page.tsx 的說明 —— 這是它的英文孿生。 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // absolute：root layout 的 title.template 是中文字串，套上去會變成
  // 「Search | 國立臺灣大學 農業經濟學系」—— 其他英文頁都走 routeMetadata 的
  // absolute 寫法，這一頁是唯一漏掉的。
  title: { absolute: `Search | ${SITE_NAME.en}` },
  robots: { index: false, follow: true },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const raw = Array.isArray(q) ? (q[0] ?? "") : (q ?? "");
  const query = raw.slice(0, 100);

  const { hits, failed } = await search(query, "en");
  return <SearchPage lang="en" query={query} hits={hits} failed={failed} />;
}
