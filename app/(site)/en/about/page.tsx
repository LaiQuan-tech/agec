import type { Metadata } from "next";
import { AboutRoute } from "@/components/site/pages";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = routeMetadata("/about", "en");

/** 本系簡介 (/about) —— 英文版，路徑加 /en 前綴 */
export default function Page() {
  return <AboutRoute lang="en" />;
}
