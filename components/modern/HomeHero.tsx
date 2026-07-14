"use client";

import { useEffect, useRef } from "react";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true; // reliably muted so autoplay is allowed (React muted-prop quirk)
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.play().catch(() => {});
    }
  }, []);

  return (
    <section
      style={{ position: "relative", borderRadius: 0, overflow: "hidden", height: "100svh", background: "#d5cfba" }}
      aria-label="農業經濟學系形象影像"
    >
      {/* parallax layer (extra height to hide edges as it translates) */}
      <div ref={parallaxRef} style={{ position: "absolute", left: 0, right: 0, top: "-16%", height: "132%" }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/hero-poster.jpg"
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
      </div>

      {/* diagonal green scrim */}
      <div
        style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg,rgba(0,52,26,.62) 0%,rgba(0,52,26,.2) 55%,transparent 100%)" }}
      />

      {/* left-bottom copy */}
      <div className="absolute bottom-0 left-0" style={{ padding: "clamp(28px,5vw,56px)", maxWidth: 760 }}>
        <div
          className={`${styles.enter} text-[11px] tracking-[.18em] sm:text-[13px] sm:tracking-[.3em]`}
          style={{ fontWeight: 700, textTransform: "uppercase", color: "var(--gold-bright)", marginBottom: 22, animationDelay: ".1s" }}
        >
          National Taiwan University
        </div>
        <h1
          className={`${styles.enter} text-[34px] sm:text-[52px] lg:text-[60px]`}
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
