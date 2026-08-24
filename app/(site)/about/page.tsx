import type { Metadata } from "next";
import { AboutRoute } from "@/components/site/pages";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = routeMetadata("/about", "zh");

/** 本系簡介 (/about) */
export default function Page() {
  return <AboutRoute lang="zh" />;
}
