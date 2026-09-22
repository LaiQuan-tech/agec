import type { Metadata } from "next";
import { GivingRoute } from "@/components/site/pages";
import { GIVING } from "@/lib/i18n/giving";
import { listingMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = listingMetadata(
  "/alumni/giving",
  "zh",
  GIVING.title.zh
);

/**
 * 匯款帳號資訊 (/alumni/giving) —— /alumni#section-3「支持農經」的內頁。
 *
 * 靜態路段，與 /alumni/events/[slug] 是兄弟而不是它的一個 slug，所以不會被
 * 活動路由接住。內容來自 page_copy（後台 /admin/giving），存檔時
 * lib/admin/revalidate.ts 會打這一頁；300 秒是那條路徑失效時的兜底。
 */
export default function Page() {
  return <GivingRoute lang="zh" />;
}
