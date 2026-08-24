import type { Metadata } from "next";
import { StudentsRoute } from "@/components/site/pages";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = routeMetadata("/students", "en");

/** 學生專區 (/students) —— 英文版，路徑加 /en 前綴 */
export default function Page() {
  return <StudentsRoute lang="en" />;
}
