"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { HOME_HERO } from "@/lib/i18n/home";

/**
 * `section.hero#top` — the home page's video carousel.
 *
 * The two clips are the department's own films, the same pair the current
 * official site (agec.ntu.edu.tw) runs in its jPlayer banner. Both are re-encoded
 * for the web from the originals: 1080p, **no audio track**, `+faststart`.
 * Stripping the audio is not an optimisation — browsers refuse to autoplay a
 * video with sound, and a muted track is bytes nobody will ever hear.
 *
 * ⚠️ Both source films end on a white logo card (8 of video 1's 26 seconds,
 * 4 of video 2's 132). The hero headline is white, so those stretches would
 * make the page's own title disappear. Both are trimmed just before the fade —
 * 17.8s and 127s. An end card is for a film that finishes; this one loops, and
 * the site already carries the logo in its header. If either video is ever
 * re-encoded, check for the white tail again.
 *
 * Timing is driven by the videos, not a clock: each slide advances when its
 * own clip ends. That is why neither <video> carries `loop` — `loop` restarts
 * the clip instead of firing `ended`, and the carousel would sit on slide 1
 * forever. The cycle comes from the index wrapping instead.
 *
 * Faithful details kept from the ported reference:
 *  - `prefers-reduced-motion` is read once at mount, not watched. Changing the
 *    OS setting mid-visit has no effect on the reference site either.
 *  - the video's `play()` rejection is swallowed: mobile autoplay policies
 *    reject it routinely and an unhandled rejection would surface in the console.
 */
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * How close to the end of a clip the *next* one starts buffering.
 *
 * Slide 2 is 16.5MB and ships `preload="none"`, so it is not fetched at all
 * unless a visitor is still here after slide 1 — which most are not. That saves
 * the bytes, but it also means the switch would otherwise land on an empty
 * element while the browser starts the download. Five seconds is enough of a
 * head start to have something decoded by the crossfade.
 */
const PRELOAD_LEAD_SECONDS = 5;

const SLIDES = [
  { src: "/videos/hero-1.mp4", poster: "/images/hero-desktop/hero-1.jpg" },
  { src: "/videos/hero-2.mp4", poster: "/images/hero-desktop/hero-2.jpg" },
];

export function HomeHero({ lang }: { lang: Lang }) {
  const t = translate(HOME_HERO, lang);
  const [index, setIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const videos = videoRefs.current;
    const current = videos[index];
    if (!current) return;

    /**
     * Reduced motion stops here: nothing plays, so `ended` never fires and the
     * hero stays on slide 1's poster frame. That is the intended result, not a
     * broken carousel — someone who asked for less movement gets a still image.
     */
    if (window.matchMedia(REDUCED_MOTION).matches) {
      videos.forEach((video) => video?.pause());
      return;
    }

    // Every other clip stops: two videos decoding at once is CPU and battery
    // spent on frames nobody can see behind the active one.
    videos.forEach((video, i) => {
      if (video && i !== index) video.pause();
    });

    // Rewind before playing. Without this the second time round a clip resumes
    // from wherever it was paused rather than starting over.
    current.currentTime = 0;
    current.play().catch(() => {});

    const advance = () => setIndex((i) => (i + 1) % SLIDES.length);

    // Give the next clip a head start — see PRELOAD_LEAD_SECONDS.
    const next = videos[(index + 1) % SLIDES.length];
    const primeNext = () => {
      if (!next || next.preload === "auto") return;
      if (current.duration - current.currentTime > PRELOAD_LEAD_SECONDS) return;
      next.preload = "auto";
      next.load();
    };

    current.addEventListener("ended", advance);
    current.addEventListener("timeupdate", primeNext);
    return () => {
      current.removeEventListener("ended", advance);
      current.removeEventListener("timeupdate", primeNext);
    };
  }, [index]);

  return (
    <section className="hero" id="top">
      <div className="hero-carousel">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className={`hero-image${index === i ? " active" : ""}`}
            aria-hidden="true"
          >
            <video
              ref={(el) => {
                videoRefs.current[i] = el;
              }}
              // muted + playsInline + autoPlay together: drop any one of the
              // three and iOS refuses to start the video at all.
              autoPlay={i === 0}
              muted
              playsInline
              // The first clip needs enough to start; the second is 16.5MB and
              // must not be fetched until it is nearly needed.
              preload={i === 0 ? "metadata" : "none"}
              poster={slide.poster}
              tabIndex={-1}
              aria-hidden="true"
            >
              <source src={slide.src} type="video/mp4" />
            </video>
          </div>
        ))}
      </div>

      <div className="hero-text-scrim" aria-hidden="true" />

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
              {t.explore} <span>↗︎</span>
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
    </section>
  );
}
