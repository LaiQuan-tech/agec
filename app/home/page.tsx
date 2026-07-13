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
 * /home — 風格A/B 版網站首頁. Moved here verbatim from the former app/page.tsx so
 * the A/B site (classic/modern components) stays exactly as it was while the
 * root / now leads with the Apple pitch deck. The classic/modern page
 * components are unchanged.
 */
export default async function AbHomePage() {
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
