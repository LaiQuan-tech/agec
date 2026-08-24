import type { Metadata } from "next";
import { FacultyRoute } from "@/components/site/pages";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = routeMetadata("/faculty", "en");

/** 系所成員 (/faculty) —— 英文版，路徑加 /en 前綴 */
export default function Page() {
  return <FacultyRoute lang="en" />;
}
