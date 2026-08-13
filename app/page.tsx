import type { Metadata } from "next";
import { getNewsHome, getPrograms } from "@/lib/data";
import { ClassicHome } from "@/components/classic/Home";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "首頁",
};

/**
 * 首頁 (/) — 風格A 經典學院派網站首頁。
 */
export default async function HomePage() {
  const [newsHome, programs] = await Promise.all([
    getNewsHome(4),
    getPrograms(),
  ]);

  return <ClassicHome newsHome={newsHome} programs={programs} />;
}
