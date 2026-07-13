"use client";

import Image from "next/image";
import Link from "next/link";
import { useParallax } from "@/hooks/useParallax";
import { SERIF } from "./format";
import styles from "./classic.module.css";

/**
 * 660px home hero — parallax field image (coefficient 0.34) with a Ken Burns
 * inner layer, dark-green gradient scrim, and centered serif copy that rises
 * in on load. README §首頁 A / prototype hero block.
 */
export function HomeHero() {
  const parallaxRef = useParallax<HTMLDivElement>(0.34);

  return (
    <section
      style={{ position: "relative", height: 660, overflow: "hidden", background: "#cfc9b4" }}
      aria-label="農業經濟學系形象影像"
    >
      {/* parallax layer (extra height to hide edges as it translates) */}
      <div ref={parallaxRef} style={{ position: "absolute", left: 0, right: 0, top: "-18%", height: "136%" }}>
        <div className="kb-bg" style={{ position: "absolute", inset: 0 }}>
          <Image src="/images/hero.png" alt="" fill priority sizes="100vw" style={{ objectFit: "cover" }} />
        </div>
      </div>

      {/* gradient scrim */}
      <div
        style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(0,52,26,.15),rgba(0,52,26,.62))" }}
      />

      {/* centered copy */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center md:px-[60px]">
        <div className={styles.enter} style={{ width: 44, height: 3, background: "var(--brand-gold)", borderRadius: 2, marginBottom: 26, animationDelay: ".05s" }} />
        <div
          className={`${styles.enter} text-[11px] tracking-[.16em] sm:text-[13px] sm:tracking-[.3em] lg:text-[15px] lg:tracking-[.42em]`}
          style={{ fontFamily: SERIF, color: "var(--gold-bright)", textTransform: "uppercase", marginBottom: 20, animationDelay: ".12s" }}
        >
          Since 1919 · World-Class Agricultural Economics
        </div>
        <h1
          className={`${styles.enter} text-[38px] sm:text-[48px] lg:text-[58px]`}
          style={{ fontFamily: SERIF, fontWeight: 700, lineHeight: 1.24, margin: 0, color: "#fff", textShadow: "0 2px 24px rgba(20,30,20,.4)", animationDelay: ".2s" }}
        >
          培育世界一流的
          <br />
          農業經濟人才
        </h1>
        <p
          className={styles.enter}
          style={{ maxWidth: 640, margin: "26px 0 0", fontSize: 16, lineHeight: 1.9, color: "#f4f6f0", animationDelay: ".28s" }}
        >
          追求頂尖之教學與研究水準，結合政策、市場與永續，回應臺灣與全球農業的關鍵課題。
        </p>
        <div className={`${styles.enter} flex flex-wrap justify-center gap-4`} style={{ marginTop: 36, animationDelay: ".36s" }}>
          <Link
            href="/admissions"
            className={styles.btnY}
            style={{ background: "var(--brand-gold)", color: "var(--gold-ink)", fontWeight: 700, fontSize: 15, padding: "13px 30px", borderRadius: 2 }}
          >
            招生資訊
          </Link>
          <Link
            href="/about"
            className={styles.btnY}
            style={{ border: "1px solid rgba(255,255,255,.75)", color: "#fff", fontWeight: 500, fontSize: 15, padding: "13px 30px", borderRadius: 2 }}
          >
            認識本系
          </Link>
        </div>
      </div>

      <div
        aria-hidden="true"
        style={{ position: "absolute", bottom: 16, right: 20, font: "500 11px/1 ui-monospace,monospace", letterSpacing: ".1em", color: "rgba(255,215,88,.9)" }}
      >
        ▶ VIDEO · 自動播放 / 靜音 / 循環
      </div>
    </section>
  );
}
