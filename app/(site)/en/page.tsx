import type { Metadata } from "next";
import { HomeRoute } from "@/components/site/pages";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = routeMetadata("/", "en");

/** 首頁 (/) —— 英文版，路徑加 /en 前綴 */
export default function Page() {
  return <HomeRoute lang="en" />;
}
