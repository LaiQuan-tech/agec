"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { HOME_HERO } from "@/lib/i18n/home";

/**
 * `section.hero#top` — the home page's two-slide carousel, ported from site.js
 * lines 30–62.
 *
 * The two slides are hard-coded because they aren't the same shape: slide 1 is a
 * <div> wrapping a looping video, slide 2 is a <picture> with mobile art
 * direction. site.js collected them by `.hero-image` class rather than tag for
 * exactly this reason.
 *
 * Three overlays the reference site draws on top of the hero were removed at
 * the client's request: `.hero-index` (the four Latin terms down the right
 * edge), `.hero-pagination` (the 01 / 02 slide buttons) and the `.scroll-cue`
 * "SCROLL" marker. The carousel itself is untouched and still advances on its
 * own; it simply has no visible control any more. Its CSS is still in site.css,
 * so restoring any of them is a matter of putting the markup back.
 *
 * Faithful details:
 *  - autoplay is 7s and is cleared on unmount, otherwise the timer would
 *    outlive a client navigation away (the original never cleared it at all).
 *  - `prefers-reduced-motion` is read once at mount, not watched. Changing the
 *    OS setting mid-visit has no effect on the reference site either.
 *  - only the visible slide's image carries alt text.
 *  - the video's `play()` rejection is swallowed: mobile autoplay policies
 *    reject it routinely and an unhandled rejection would surface in the console.
 */
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

export function HomeHero({ lang }: { lang: Lang }) {
  const t = translate(HOME_HERO, lang);
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
            alt={index === 1 ? t.gateAlt : ""}
          />
        </picture>
      </div>

      <div className="hero-text-scrim" aria-hidden="true" />

      {/* `.hero-content` is `grid-template-columns: 1fr auto`. The `auto`
          column held `.hero-index` (the four Latin terms down the right edge)
          until it was removed at the client's request; a grid with one child
          simply gives it the `1fr` track, so the copy block keeps its width
          and nothing else moves. */}
      <div className="container hero-content" id="content">
        <div className="hero-copy">
          {/* Latin-caps kicker, not copy: printed the same on both sites. */}
          <p className="eyebrow light">AGRICULTURAL ECONOMICS · NTU</p>
          <h1>
            {t.titleLine1}
            <br />
            {t.titleLine2}
            <br />
            {t.titleLine3}
          </h1>
          <p className="hero-lead">{t.lead}</p>
          <div className="hero-actions">
            <Link className="button gold" href={localizePath("/about", lang)}>
              {t.explore} <span>↗</span>
            </Link>
            <Link
              className="text-action"
              href={localizePath("/admissions", lang)}
            >
              {t.admissions} <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* English on both sites: a typographic device, not a sentence.
          The `.scroll-cue` span that sat beside it was removed at the client's
          request. `.hero-foot` is `justify-content: space-between`, which with
          one child is equivalent to flex-start, so the line stays put at the
          left — and the mobile override that hides this span and switches to
          `flex-end` now leaves the bar empty rather than misaligned. */}
      <div className="hero-foot container">
        <span>Nearly a century of inquiry</span>
      </div>
    </section>
  );
}
