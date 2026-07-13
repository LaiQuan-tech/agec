import { getNewsHome, getPrograms } from "@/lib/data";
import { PitchDeck } from "@/components/deck/PitchDeck";

export const revalidate = 300;

/**
 * 首頁 (/) — 投影片版. The homepage is now the full-screen, one-slide-at-a-time
 * 簡報 (see components/deck/*). It is token-driven, so the 右上角 A/B toggle still
 * re-skins it live (經典 襯線+直角 / 現代 黑體+大圓角). The 風格A / 風格B page
 * components (components/classic|modern/*) remain in the repo and still power
 * the inner routes (/news, /faculty, …); only the homepage now leads with the
 * deck. /deck stays as an equivalent alias.
 */
export default async function HomePage() {
  const [newsHome, programs] = await Promise.all([
    getNewsHome(4),
    getPrograms(),
  ]);

  return <PitchDeck newsHome={newsHome} programs={programs} />;
}
