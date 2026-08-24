import type { Metadata } from "next";
import { StudentsRoute } from "@/components/site/pages";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = routeMetadata("/students", "zh");

/** 學生專區 (/students) */
export default function Page() {
  return <StudentsRoute lang="zh" />;
}
