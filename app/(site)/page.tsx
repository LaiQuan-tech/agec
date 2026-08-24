import type { Metadata } from "next";
import { HomeRoute } from "@/components/site/pages";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = routeMetadata("/", "zh");

/** 首頁 (/) */
export default function Page() {
  return <HomeRoute lang="zh" />;
}
