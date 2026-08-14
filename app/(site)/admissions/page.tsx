import type { Metadata } from "next";
import { getLinks, getPrograms } from "@/lib/data";
import { Admissions } from "@/components/site/Admissions";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "招生資訊",
  description:
    "以經濟洞見回應世界的農業挑戰。國立臺灣大學農業經濟學系官方網站。",
};

/**
 * 招生資訊 (/admissions) — ported from the reference site's admissions.html.
 * `.program-grid` reads getPrograms(); the 重要時程 and 核心能力 blocks are
 * static copy (no table exists for either).
 */
export default async function AdmissionsPage() {
  const [programs, links] = await Promise.all([
    getPrograms(),
    getLinks("admissions"),
  ]);

  return <Admissions programs={programs} links={links} />;
}
