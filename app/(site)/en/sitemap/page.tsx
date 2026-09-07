import type { Metadata } from "next";
import { SitemapPage } from "@/components/site/SitemapPage";
import { routeMetadata } from "@/lib/site-routes";

/** 見 app/(site)/sitemap/page.tsx —— 這是它的英文孿生。 */
export const metadata: Metadata = routeMetadata("/sitemap", "en");

export default function Page() {
  return <SitemapPage lang="en" />;
}
