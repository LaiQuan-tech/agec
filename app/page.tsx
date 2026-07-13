import type { Metadata } from "next";
import { getNewsHome, getPrograms } from "@/lib/data";
import { ThemedRoute } from "@/components/theme/ThemedRoute";
import { ClassicHome } from "@/components/classic/Home";
import { ModernHome } from "@/components/modern/Home";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "首頁",
};

/**
 * 首頁 (/) — 風格A/B 版網站首頁，右上角可切換經典A／現代B 主題。
 */
export default async function HomePage() {
  const [newsHome, programs] = await Promise.all([
    getNewsHome(4),
    getPrograms(),
  ]);

  return (
    <ThemedRoute
      classic={<ClassicHome newsHome={newsHome} programs={programs} />}
      modern={<ModernHome newsHome={newsHome} programs={programs} />}
    />
  );
}
