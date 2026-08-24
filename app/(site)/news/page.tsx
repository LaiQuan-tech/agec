import type { Metadata } from "next";
import { NewsRoute } from "@/components/site/pages";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = routeMetadata("/news", "zh");

/** 最新消息 (/news) */
export default function Page() {
  return <NewsRoute lang="zh" />;
}
