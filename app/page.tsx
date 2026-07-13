import { getNewsHome, getPrograms } from "@/lib/data";
import { PitchDeck } from "@/components/deck/PitchDeck";

export const revalidate = 300;

/**
 * 首頁 (/) — Apple 風 pitch deck. The root is the full-screen 簡報
 * (components/deck/*). The 風格A/B 版網站 is untouched — its homepage lives at
 * /home (app/home/page.tsx) and its inner routes (/news, /faculty, …) are
 * unchanged. /deck stays as an equivalent alias of this deck.
 */
export default async function HomePage() {
  const [newsHome, programs] = await Promise.all([
    getNewsHome(4),
    getPrograms(),
  ]);

  return <PitchDeck newsHome={newsHome} programs={programs} />;
}
