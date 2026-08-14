import type { Metadata } from "next";
import { getLinks, getPrograms, type LinkItem } from "@/lib/data";
import { Admissions } from "@/components/site/Admissions";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "招生資訊",
  description:
    "以經濟洞見回應世界的農業挑戰。國立臺灣大學農業經濟學系官方網站。",
};

/**
 * The `.resource-row` cards belong to a `links.section` value that does not
 * exist yet: PORT-REPORT §2.4 lists `admissions` as one of three sections still
 * to be added to the table, and `LinkItem["section"]` in lib/data.ts is still
 * the old `students | alumni | journal` union. Widening that union touches a
 * shared file that other pages are being ported against, so the cast stays
 * local here — the query is a plain `.eq('section', …)` and returns [] until
 * the rows are seeded, at which point the page picks them up with no code
 * change (see RESOURCE_FALLBACK in components/site/Admissions.tsx).
 */
const ADMISSIONS_SECTION = "admissions" as LinkItem["section"];

/**
 * 招生資訊 (/admissions) — ported from the reference site's admissions.html.
 * `.program-grid` reads getPrograms(); the 重要時程 and 核心能力 blocks are
 * static copy (no table exists for either).
 */
export default async function AdmissionsPage() {
  const [programs, links] = await Promise.all([
    getPrograms(),
    getLinks(ADMISSIONS_SECTION),
  ]);

  return <Admissions programs={programs} links={links} />;
}
