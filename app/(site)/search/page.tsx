import type { Metadata } from "next";
import { SearchPage } from "@/components/site/SearchPage";
import { search } from "@/lib/search";

/**
 * ⚠️ 全站唯一的動態公開路由。
 *
 * 其餘 30 條都是靜態 ISR。這一條不是漏掉的重構 —— 查詢字串是無限的，預先產生
 * 沒有意義，而且搜尋結果本來就不該被快取（消息一發佈就該搜得到）。
 * 完整說明見 components/site/SearchPage.tsx 的檔頭。
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "搜尋",
  // 🔴 不要被索引。搜尋結果頁會產生無限多個內容重複的網址，而讀者真正要的是
  // 被搜到的那一則消息本身，不是這一頁。follow 仍為 true —— 結果裡的連結
  // 指向真正該被索引的頁面。
  robots: { index: false, follow: true },
};

export default async function Page({
  searchParams,
}: {
  // Next 16：searchParams 是 promise。
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  // ⚠️ 同一個 key 出現兩次時 Next 會給陣列（?q=a&q=b）。取第一個，不要讓後續
  //    的字串操作在陣列上炸掉。
  const raw = Array.isArray(q) ? (q[0] ?? "") : (q ?? "");
  // 上限 100 字：再長的查詢對 ilike 沒有意義，只是讓人可以塞一大包字串進來。
  const query = raw.slice(0, 100);

  const { hits, failed } = await search(query, "zh");
  return <SearchPage lang="zh" query={query} hits={hits} failed={failed} />;
}
