import type { Metadata } from "next";
import { BlogRoute } from "@/components/site/pages";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = routeMetadata("/blog", "en");

/** 專欄文章 (/blog) —— 英文版，路徑加 /en 前綴 */
export default function Page() {
  return <BlogRoute lang="en" />;
}
