import type { Metadata } from "next";
import { Alumni } from "@/components/site/Alumni";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "系友專區",
  description:
    "以經濟洞見回應世界的農業挑戰。國立臺灣大學農業經濟學系官方網站。",
};

/**
 * 系友專區 (/alumni) — ported from the reference site's alumni.html.
 *
 * The previous `getLinks("alumni")` read is gone: the reference page's only
 * list-shaped block is `.story-grid`, whose cards need an eyebrow and an action
 * label that the `links` table has no columns for (see the note in
 * components/site/Alumni.tsx). `revalidate` is kept for parity with the other
 * public routes.
 */
export default function AlumniPage() {
  return <Alumni />;
}
