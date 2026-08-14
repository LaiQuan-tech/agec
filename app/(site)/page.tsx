import type { Metadata } from "next";
import { getNewsHome, getPrograms } from "@/lib/data";
import { Home } from "@/components/site/Home";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "首頁",
  description:
    "以經濟洞見回應世界的農業挑戰。國立臺灣大學農業經濟學系官方網站。",
};

/** 首頁 (/) — ported from the reference site's index.html. */
export default async function HomePage() {
  // 5, not 4: the 最新消息 band is one `.feature-story` plus a 4-row
  // `.news-list`, and both come off the same query.
  const [newsHome, programs] = await Promise.all([
    getNewsHome(5),
    getPrograms(),
  ]);

  return <Home newsHome={newsHome} programs={programs} />;
}
