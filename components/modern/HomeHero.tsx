"use client";

import Image from "next/image";
import { useParallax } from "@/hooks/useParallax";
import { SANS } from "./format";
import styles from "./modern.module.css";

/**
 * 580px rounded (var(--radius-hero) → 22px) home hero — parallax field image
 * (coefficient 0.28) with a Ken Burns inner layer, diagonal green scrim, and
 * left-bottom aligned 900-weight copy that rises in on load. README §首頁 B /
 * prototype rounded hero block.
 */
export function HomeHero() {
  const parallaxRef = useParallax<HTMLDivElement>(0.28);

  return (
    <section
      style={{ position: "relative", borderRadius: "var(--radius-hero)", overflow: "hidden", height: 580, background: "#d5cfba" }}
      aria-label="農業經濟學系形象影像"
    >
      {/* parallax layer (extra height to hide edges as it translates) */}
      <div ref={parallaxRef} style={{ position: "absolute", left: 0, right: 0, top: "-16%", height: "132%" }}>
        <div className="kb-bg" style={{ position: "absolute", inset: 0 }}>
          <Image src="/images/hero.png" alt="" fill priority sizes="100vw" style={{ objectFit: "cover" }} />
        </div>
      </div>

      {/* diagonal green scrim */}
      <div
        style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg,rgba(25,45,30,.62) 0%,rgba(25,45,30,.2) 55%,transparent 100%)" }}
      />

      {/* left-bottom copy */}
      <div className="absolute bottom-0 left-0" style={{ padding: "clamp(28px,5vw,56px)", maxWidth: 760 }}>
        <div
          className={styles.enter}
          style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".3em", textTransform: "uppercase", color: "var(--gold-bright)", marginBottom: 22, animationDelay: ".1s" }}
        >
          National Taiwan University
        </div>
        <h1
          className={`${styles.enter} text-[40px] sm:text-[52px] lg:text-[60px]`}
          style={{ fontFamily: SANS, lineHeight: 1.1, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-.01em", textShadow: "0 2px 24px rgba(20,30,20,.35)", animationDelay: ".18s" }}
        >
          農業經濟，
          <br />
          連結土地與世界
        </h1>
        <p
          className={styles.enter}
          style={{ fontSize: 17, lineHeight: 1.8, color: "#eef1ec", margin: "26px 0 0", maxWidth: 520, animationDelay: ".26s" }}
        >
          從市場、政策到永續發展，以嚴謹的經濟分析回應臺灣與全球農業的挑戰。
        </p>
      </div>

      <div
        aria-hidden="true"
        style={{ position: "absolute", top: 24, right: 24, font: "500 11px/1 ui-monospace,monospace", letterSpacing: ".12em", color: "rgba(255,215,88,.9)" }}
      >
        ▶ 自動播放 · 靜音 · 循環
      </div>
    </section>
  );
}
