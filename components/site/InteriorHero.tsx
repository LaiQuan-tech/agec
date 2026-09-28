import Link from "next/link";
import { ROUTE_TOTAL } from "./nav";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { SHARED } from "@/lib/i18n/shared";

export type InteriorHeroProps = {
  lang: Lang;
  /** Slug used for both hero images, e.g. "about" → images/hero-*\/about.jpg. */
  slug: string;
  /** Chinese page title. */
  titleZh: string;
  /**
   * English page title, e.g. "About AGEC".
   *
   * Both languages are always passed because /en's hero shows both: titleZh
   * becomes the small kicker above its <h1>, the same lockup the reference
   * site uses throughout. The Chinese hero used to mirror that — titleEn as
   * its own kicker above the Chinese <h1> — but the client asked
   * 2026-09-28 that the Chinese site print no Latin text, so the Chinese
   * hero no longer renders a kicker at all; titleEn is now used only for
   * /en's <h1> and breadcrumb.
   */
  titleEn: string;
  /**
   * "NN" half of the route number; the "/ 08" denominator is added here.
   *
   * Omit it for a page that is not one of the eight routes in lib/nav.ts —
   * `.interior-title-row` is
   * `justify-content: space-between`, so dropping the second child simply
   * leaves the title block left-aligned rather than breaking the row.
   */
  routeNo?: string;
  /** Standfirst paragraph under the title row, already in the right language. */
  lead: string;
  /** alt text for the hero photo, already in the right language. */
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
  lang,
  slug,
  titleZh,
  titleEn,
  routeNo,
  lead,
  imageAlt,
  video,
}: InteriorHeroProps) {
  const t = translate(SHARED, lang);
  const title = lang === "en" ? titleEn : titleZh;
  const kicker = lang === "en" ? titleZh : titleEn;

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
          <Link href={localizePath("/", lang)}>{t.home}</Link>
          <span>/</span>
          <span>{title}</span>
        </div>
        {/* Exactly two children: `.interior-title-row` is a flex row and the
            route number is addressed as its second child. */}
        <div className="interior-title-row">
          <div>
            {/* zh: no kicker at all — the client asked 2026-09-28 that the
                Chinese site print no Latin text, and titleEn (the only
                candidate for a zh kicker) is English. en: unchanged, still
                prints titleZh as its kicker above the English <h1>. */}
            {lang === "en" && <p>{kicker}</p>}
            <h1>{title}</h1>
          </div>
          {/* One interpolation, not three. Written as `{routeNo} / {ROUTE_TOTAL}`
              React emits three text nodes, and the browser shapes the run in
              three pieces — measurably 0.016px wider than the reference at the
              600 and 375 breakpoints. Joining them first makes it one run. */}
          {routeNo ? (
            <span className="route-number">{`${routeNo} / ${ROUTE_TOTAL}`}</span>
          ) : null}
        </div>
        <p className="interior-lead">{lead}</p>
      </div>
    </section>
  );
}
