import type { Metadata } from "next";
import { FacultyRoute } from "@/components/site/pages";
import { routeMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = routeMetadata("/faculty", "zh");

/** 系所成員 (/faculty) */
export default function Page() {
  return <FacultyRoute lang="zh" />;
}
