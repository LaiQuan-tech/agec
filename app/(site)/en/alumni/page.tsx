import type { Metadata } from "next";
import { AlumniRoute } from "@/components/site/pages";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = routeMetadata("/alumni", "en");

/** 系友專區 (/alumni) —— 英文版，路徑加 /en 前綴 */
export default function Page() {
  return <AlumniRoute lang="en" />;
}
