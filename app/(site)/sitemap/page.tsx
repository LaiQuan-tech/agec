import type { Metadata } from "next";
import { SitemapPage } from "@/components/site/SitemapPage";
import { routeMetadata } from "@/lib/site-routes";

/**
 * 網站導覽 (/sitemap).
 *
 * ⚠️ 這一頁與 app/sitemap.ts 是兩件不同的東西，名字像而已：那一支產生
 * /sitemap.xml（給爬蟲的 XML），這一支是 /sitemap（給人看的頁面）。
 * 兩條路徑不同，不會互相覆蓋。
 *
 * 完全靜態：整棵樹在 build 時就從 lib/nav.ts 與各頁的字典推導完成，沒有任何
 * 資料庫讀取，所以不需要 revalidate。
 */
export const metadata: Metadata = routeMetadata("/sitemap", "zh");

export default function Page() {
  return <SitemapPage lang="zh" />;
}
