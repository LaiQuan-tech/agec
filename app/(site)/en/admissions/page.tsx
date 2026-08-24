import type { Metadata } from "next";
import { AdmissionsRoute } from "@/components/site/pages";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = routeMetadata("/admissions", "en");

/** 招生資訊 (/admissions) —— 英文版，路徑加 /en 前綴 */
export default function Page() {
  return <AdmissionsRoute lang="en" />;
}
