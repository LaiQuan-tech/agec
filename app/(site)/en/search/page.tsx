import type { Metadata } from "next";
import { SearchPage } from "@/components/site/SearchPage";
import { search } from "@/lib/search";

/** 見 app/(site)/search/page.tsx 的說明 —— 這是它的英文孿生。 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
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
