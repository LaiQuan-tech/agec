import type { Metadata } from "next";
import { CoursesRoute } from "@/components/site/pages";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = routeMetadata("/courses", "en");

/** 課程資訊 (/courses) —— 英文版，路徑加 /en 前綴 */
export default function Page() {
  return <CoursesRoute lang="en" />;
}
