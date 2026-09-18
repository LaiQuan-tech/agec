import type { Metadata } from "next";
import { TalksRoute } from "@/components/site/pages";
import { NEWS } from "@/lib/i18n/news";
import { listingMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = listingMetadata(
  "/news/talks",
  "zh",
  NEWS.talksArchiveTitle.zh
);

/**
 * 演講公告封存第一頁。
 *
 * A static segment, so it wins over the `/news/[id]` sibling — the same way
 * `/news/page/2` does. An announcement can never have the id "talks", so
 * nothing is shadowed.
 */
export default async function Page() {
  return <TalksRoute lang="zh" />;
}
