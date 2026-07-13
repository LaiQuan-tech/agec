"use client";

import Image from "next/image";
import { useParallax } from "@/hooks/useParallax";
import { Reveal } from "./Reveal";
import { SERIF } from "./format";

const STATS = [
  { n: "1919", label: "學術傳承起點" },
  { n: "450+", label: "碩博畢業系友" },
  { n: "5", label: "完整學制" },
];

/**
 * 480px full-bleed parallax statement band (coefficient 0.30) — campus image,
 * dark-green scrim, serif quote and three gold statistics that fade up on
 * scroll. README §首頁 A / prototype "full-bleed parallax statement".
 */
export function StatementBand() {
  const parallaxRef = useParallax<HTMLDivElement>(0.3);

  return (
    <section style={{ position: "relative", height: 480, overflow: "hidden" }}>
      <div ref={parallaxRef} style={{ position: "absolute", left: 0, right: 0, top: "-18%", height: "136%" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <Image src="/images/campus.png" alt="" fill sizes="100vw" style={{ objectFit: "cover" }} />
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(0,40,20,.74),rgba(0,40,20,.84))" }} />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{ padding: "0 8%" }}>
        <Reveal style={{ maxWidth: 960 }}>
          <div style={{ fontFamily: SERIF, fontSize: "13.5px", letterSpacing: ".4em", color: "var(--gold-bright)", textTransform: "uppercase", marginBottom: 22 }}>
            Excellence · 世界一流的追求
          </div>
          <p className="text-[24px] md:text-[34px]" style={{ fontFamily: SERIF, lineHeight: 1.55, fontWeight: 500, color: "#fff", margin: 0 }}>
            以嚴謹的經濟分析回應土地、市場
            <br />
            與全球農業的關鍵課題。
          </p>
        </Reveal>

        <Reveal className="flex flex-wrap justify-center gap-y-8" style={{ columnGap: 72, marginTop: 52 }}>
          {STATS.map((s) => (
            <div key={s.n}>
              <div style={{ fontFamily: SERIF, fontSize: 46, fontWeight: 700, color: "var(--gold-bright)" }}>{s.n}</div>
              <div style={{ fontSize: 13, color: "#c2d6c9", letterSpacing: ".06em", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
