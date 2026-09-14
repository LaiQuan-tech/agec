"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { HOME_HERO } from "@/lib/i18n/home";

/**
 * `section.hero#top` — the home page's video hero.
 *
 * The clip is the department's 2026 introduction film (YouTube AAx8Y3xxYck,
 * channel 臺大農經系), re-encoded for the web: 1920×1080, **no audio track**,
 * `+faststart`, capped at 1.1 Mbit/s (40 MB for 302s — streamed, so a visitor
 * only ever fetches what they watch). Stripping the audio is not an
 * optimisation — browsers refuse to autoplay a video with sound, and a muted
 * track is bytes nobody will ever hear.
 *
 * ⚠️ The film is shipped **whole** — opening title card, burned-in interview
 * captions and the three-logo end card included. The department asked for
 * all three to stay (2026-09-14), after a first cut had trimmed them:
 *  - the opening title ("Dept. of Agriculture Economics / National Taiwan
 *    University") is centred and white, and sits under the hero's own white
 *    headline for the first ~3.5s of every loop. Known and accepted.
 *  - the captions run along the bottom edge, which is the hero's bottom edge:
 *    on viewports shorter than the hero's 920px minimum they are below the
 *    fold until the visitor scrolls; on a phone the portrait crop clips long
 *    lines at both sides. Both are the film's framing, not a bug.
 *  - the end card loops straight back into the opening shot.
 *  Do not "clean up" any of the three in a re-encode without asking.
 *
 *  The one edit that stays is the AGEC watermark in the top-left corner
 *  (ffmpeg `delogo`): its lower half peeked out under the site header at
 *  1440×900, and the header already carries the same mark. The interpolated
 *  patch is a faint smear where a palm crosses it, and it sits under the
 *  header.
 *
 * The component is still the carousel the reference site shipped, so a second
 * clip can be added back by appending to SLIDES. With one slide the clip
 * simply loops (`LOOPS`); with two or more, timing is driven by the videos,
 * not a clock: each slide advances when its own clip ends, which is why the
 * carousel case must not set `loop` — `loop` restarts the clip instead of
 * firing `ended`, and the carousel would sit on slide 1 forever.
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
 * Any slide after the first ships `preload="none"`, so it is not fetched at
 * all unless a visitor is still here when its turn comes — which most are not.
 * That saves the bytes, but it also means the switch would otherwise land on
 * an empty element while the browser starts the download. Five seconds is
 * enough of a head start to have something decoded by the crossfade.
 * (Unused while SLIDES has one entry; kept with the carousel.)
 */
const PRELOAD_LEAD_SECONDS = 5;

const SLIDES = [
  { src: "/videos/hero-intro.mp4", poster: "/images/hero-desktop/hero-intro.jpg" },
];

/**
 * One clip loops natively; the carousel's `ended` → advance cycle is only
 * wired up when there is somewhere to advance to. See the header comment.
 */
const LOOPS = SLIDES.length === 1;

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

    // A lone clip has nothing to advance to and nothing to prime. Wiring the
    // listeners anyway would be worse than useless: `primeNext` would find
    // `next === current` and call load() on the playing video near its end.
    if (LOOPS) return;

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
              loop={LOOPS}
              // The first clip needs enough to start; any later one must not
              // be fetched until it is nearly needed (see PRELOAD_LEAD_SECONDS).
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
