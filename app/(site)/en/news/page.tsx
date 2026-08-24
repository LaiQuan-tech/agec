import type { Metadata } from "next";
import { NewsRoute } from "@/components/site/pages";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = routeMetadata("/news", "en");

/** 最新消息 (/news) —— 英文版，路徑加 /en 前綴 */
export default function Page() {
  return <NewsRoute lang="en" />;
}
