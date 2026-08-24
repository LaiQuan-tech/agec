import type { Metadata } from "next";
import { AdmissionsRoute } from "@/components/site/pages";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = routeMetadata("/admissions", "zh");

/** 招生資訊 (/admissions) */
export default function Page() {
  return <AdmissionsRoute lang="zh" />;
}
