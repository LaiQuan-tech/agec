import type { Metadata } from "next";
import { AlumniRoute } from "@/components/site/pages";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = routeMetadata("/alumni", "zh");

/** 系友專區 (/alumni) */
export default function Page() {
  return <AlumniRoute lang="zh" />;
}
