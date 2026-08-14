import Link from "next/link";
import { ROUTE_TOTAL } from "./nav";

export type InteriorHeroProps = {
  /** Slug used for both hero images, e.g. "about" → images/hero-*\/about.jpg. */
  slug: string;
  /** Chinese page title — also the breadcrumb's trailing segment. */
  title: string;
  /** English kicker above the <h1>, e.g. "About AGEC". */
  titleEn: string;
  /** "NN" half of the route number; the "/ 08" denominator is added here. */
  routeNo: string;
  /** Standfirst paragraph under the title row. */
  lead: string;
  /** alt text for the hero photo. */
  imageAlt: string;
  /**
   * Set for the two routes whose hero is a looping video instead of a
   * <picture> (only /courses in the reference site). Video heroes have no
   * mobile art direction — the desktop still doubles as the poster.
   */
  video?: string;
};

/**
 * `section.interior-hero#content` — the masthead of all 7 interior pages.
 *
 * `#content` has to stay here: it's the skip link's target on interior pages.
 * The 600px `<source>` breakpoint must match site.css's own 600px breakpoint,
 * which is where the art direction switches.
 */
export function InteriorHero({
  slug,
  title,
  titleEn,
  routeNo,
  lead,
  imageAlt,
  video,
}: InteriorHeroProps) {
  return (
    <section className="interior-hero" id="content">
      {video ? (
        <div className="interior-hero-media">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={`/images/hero-desktop/${slug}.jpg`}
            tabIndex={-1}
            aria-hidden="true"
          >
            <source src={video} type="video/mp4" />
          </video>
        </div>
      ) : (
        <picture className="interior-hero-media">
          <source
            media="(max-width: 600px)"
            srcSet={`/images/hero-mobile/${slug}.jpg`}
          />
          <img src={`/images/hero-desktop/${slug}.jpg`} alt={imageAlt} />
        </picture>
      )}
      <div className="interior-text-scrim" aria-hidden="true" />
      <div className="container interior-hero-content">
        <div className="breadcrumb">
          <Link href="/">首頁</Link>
          <span>/</span>
          <span>{title}</span>
        </div>
        {/* Exactly two children: `.interior-title-row` is a flex row and the
            route number is addressed as its second child. */}
        <div className="interior-title-row">
          <div>
            <p>{titleEn}</p>
            <h1>{title}</h1>
          </div>
          {/* One interpolation, not three. Written as `{routeNo} / {ROUTE_TOTAL}`
              React emits three text nodes, and the browser shapes the run in
              three pieces — measurably 0.016px wider than the reference at the
              600 and 375 breakpoints. Joining them first makes it one run. */}
          <span className="route-number">{`${routeNo} / ${ROUTE_TOTAL}`}</span>
        </div>
        <p className="interior-lead">{lead}</p>
      </div>
    </section>
  );
}
