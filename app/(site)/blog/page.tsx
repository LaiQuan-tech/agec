import type { Metadata } from "next";
import { BlogRoute } from "@/components/site/pages";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = routeMetadata("/blog", "zh");

/** 專欄文章 (/blog) */
export default function Page() {
  return <BlogRoute lang="zh" />;
}
