"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * `section.hero#top` — the home page's two-slide carousel, ported from site.js
 * lines 30–62.
 *
 * The two slides are hard-coded because they aren't the same shape: slide 1 is a
 * <div> wrapping a looping video, slide 2 is a <picture> with mobile art
 * direction. site.js collected them by `.hero-image` class rather than tag for
 * exactly this reason.
 *
 * Faithful details:
 *  - autoplay is 7s, and clicking a dot does *not* reset the timer (matching the
 *    original, which never cleared its interval at all — here it is cleared on
 *    unmount, otherwise the timer would outlive a client navigation away).
 *  - `prefers-reduced-motion` is read once at mount, not watched. Changing the
 *    OS setting mid-visit has no effect on the reference site either.
 *  - only the visible slide's image carries alt text.
 *  - the video's `play()` rejection is swallowed: mobile autoplay policies
 *    reject it routinely and an unhandled rejection would surface in the console.
 */
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const GATE_ALT = "國立臺灣大學正門與校園景觀";

export function HomeHero() {
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (window.matchMedia(REDUCED_MOTION).matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % 2), 7000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (index === 0 && !window.matchMedia(REDUCED_MOTION).matches) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [index]);

  return (
    <section className="hero" id="top">
      <div className="hero-carousel">
        <div
          className={`hero-image${index === 0 ? " active" : ""}`}
          aria-hidden={index !== 0}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/images/hero-desktop/hero.jpg"
            tabIndex={-1}
            aria-hidden="true"
          >
            <source src="/videos/home-intro.mp4" type="video/mp4" />
          </video>
        </div>
        <picture
          className={`hero-image${index === 1 ? " active" : ""}`}
          aria-hidden={index !== 1}
        >
          <source
            media="(max-width: 600px)"
            srcSet="/images/hero-mobile/hero-gate.jpg"
          />
          <img
            src="/images/hero-desktop/hero-gate.jpg"
            alt={index === 1 ? GATE_ALT : ""}
          />
        </picture>
      </div>

      <div className="hero-text-scrim" aria-hidden="true" />

      <div className="container hero-content" id="content">
        <div className="hero-copy">
          <p className="eyebrow light">AGRICULTURAL ECONOMICS · NTU</p>
          <h1>
            以經濟洞見，
            <br />
            回應世界的
            <br />
            農業挑戰。
          </h1>
          <p className="hero-lead">
            培育具備經濟分析、農業專業與國際視野的人才，從臺灣出發，連結土地、市場與全球。
          </p>
          <div className="hero-actions">
            <Link className="button gold" href="/about">
              探索本系 <span>↗</span>
            </Link>
            <Link className="text-action" href="/admissions">
              招生資訊 <span>→</span>
            </Link>
          </div>
        </div>
        <div className="hero-index" aria-label="研究關鍵領域">
          <span>FOOD SYSTEMS</span>
          <span>CLIMATE &amp; LAND</span>
          <span>TRADE &amp; POLICY</span>
          <span>DATA &amp; DECISIONS</span>
        </div>
      </div>

      <div className="hero-foot container">
        <span>Nearly a century of inquiry</span>
        <span className="scroll-cue">
          SCROLL <i />
        </span>
      </div>

      <div className="hero-pagination" role="group" aria-label="首頁主視覺切換">
        {[0, 1].map((i) => (
          <button
            key={i}
            type="button"
            className={index === i ? "active" : ""}
            aria-label={`顯示第 ${i + 1} 張主視覺`}
            aria-pressed={index === i}
            onClick={() => setIndex(i)}
          >
            <span>0{i + 1}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
