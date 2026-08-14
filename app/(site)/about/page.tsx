import type { Metadata } from "next";
import { About } from "@/components/site/About";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "本系簡介",
  description:
    "以經濟洞見回應世界的農業挑戰。國立臺灣大學農業經濟學系官方網站。",
};

/**
 * 本系簡介 (/about) — ported from the reference site's about.html.
 * Fully static: every block on this page is editorial copy, no DB reads.
 * `revalidate` is kept for parity with the other public routes.
 */
export default function AboutPage() {
  return <About />;
}
