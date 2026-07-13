import type { Metadata } from "next";
import { getNewsHome, getPrograms } from "@/lib/data";
import { PitchDeck } from "@/components/deck/PitchDeck";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "簡報",
  description:
    "國立臺灣大學農業經濟學系簡報版：一頁一頁全螢幕捲動的投影片式導覽。",
};

/**
 * /deck — 投影片版首頁. A standalone presentation-format route that stands apart
 * from the 風格A / 風格B production site (app/page.tsx). It reuses the same
 * Supabase content and design tokens, so the 右上角 A/B toggle still re-skins it.
 */
export default async function DeckPage() {
  const [newsHome, programs] = await Promise.all([
    getNewsHome(4),
    getPrograms(),
  ]);

  return <PitchDeck newsHome={newsHome} programs={programs} />;
}
