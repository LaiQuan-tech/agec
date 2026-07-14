"use client";

import Image from "next/image";
import { useParallax } from "@/hooks/useParallax";
import { Reveal } from "./Reveal";
import { SANS } from "./format";

/**
 * 460px rounded full-bleed parallax statement band (coefficient 0.30) — field
 * image, green scrim, and a 900-weight quote that fades up on scroll. README
 * §首頁 B / prototype rounded "full-bleed parallax statement".
 */
export function StatementBand() {
  const parallaxRef = useParallax<HTMLDivElement>(0.3);

  return (
    <section style={{ position: "relative", height: "clamp(360px, 60vw, 460px)", borderRadius: "var(--radius-hero)", overflow: "hidden" }}>
      <div ref={parallaxRef} style={{ position: "absolute", left: 0, right: 0, top: "-18%", height: "136%" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <Image src="/images/fields.png" alt="" fill sizes="100vw" style={{ objectFit: "cover" }} />
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(0,40,20,.55),rgba(0,40,20,.8))" }} />

      <div className="absolute inset-0 flex flex-col justify-center" style={{ padding: "0 clamp(28px,5vw,56px)" }}>
        <Reveal style={{ maxWidth: 720 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".3em", textTransform: "uppercase", color: "var(--gold-bright)", marginBottom: 20 }}>
            Excellence
          </div>
          <p className="text-[28px] md:text-[40px]" style={{ fontFamily: SANS, lineHeight: 1.3, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-.01em" }}>
            以嚴謹的經濟分析，回應土地、市場與全球農業的關鍵課題。
          </p>
        </Reveal>
      </div>
    </section>
  );
}
