import type { Metadata } from "next";
import { CoursesRoute } from "@/components/site/pages";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = routeMetadata("/courses", "zh");

/** 課程資訊 (/courses) */
export default function Page() {
  return <CoursesRoute lang="zh" />;
}
