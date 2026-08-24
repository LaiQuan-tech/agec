import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";
import { translate, type Lang } from "@/lib/i18n";
import { ABOUT } from "@/lib/i18n/about";

/**
 * 本系簡介 (/about) — route 03 / 08.
 *
 * Every block on this page is A-class static copy: the reference site has no
 * data source behind any of it, and PORT-REPORT §2.4 lists `ol.timeline`,
 * `.principle-grid`, `.honor-grid` and `.about-photo-grid` as B-class-but-no-getter
 * (no table, no DDL). The copy therefore lives in lib/i18n/about.ts — hard-coded
 * in both languages, on purpose — because site.css pins each grid's borders with
 * positional selectors, so a 5th entry breaks the layout at the 1180px / 860px
 * breakpoints while still looking correct on desktop.
 *
 *   .principle-grid   — 4 items; `article:nth-child(3){border-left}` +
 *                       `article:last-child{border-right}` assume exactly 4.
 *   .honor-grid       — 4 items; `article:nth-child(2n)` paints the checkerboard,
 *                       so the count must stay even.
 *   ol.timeline       — 5 items; `.timeline li{grid-template-columns:100px 1fr}`
 *                       needs the literal <ol><li><strong>+<div> shape.
 *   .about-photo-grid — 3 <figure>; layout is hard-wired 1 wide + 2 normal via
 *                       `.about-photo-wide{grid-column:1/-1}`.
 *
 * Those four counts are a property of the stylesheet, not of the language, so
 * the two dictionaries must stay the same length as each other as well.
 */
export function About({ lang }: { lang: Lang }) {
  const t = translate(ABOUT, lang);

  return (
    <SiteShell lang={lang} variant="interior">
      {/* The hero takes both titles: whichever is not the page's language
          becomes the kicker above the <h1>, so `ABOUT.title` is read here as
          the untranslated pair rather than through `t`. */}
      <InteriorHero
        lang={lang}
        slug="about"
        titleZh={ABOUT.title.zh}
        titleEn={ABOUT.title.en}
        routeNo="03"
        lead={t.lead}
        imageAlt={t.heroImageAlt}
      />

      <LocalNav
        lang={lang}
        label={t.title}
        items={[
          { href: "#section-1", label: t.nav.history },
          { href: "#section-2", label: t.nav.mission },
          { href: "#section-3", label: t.nav.honors },
          { href: "#section-4", label: t.nav.environment },
        ]}
      />

      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            {/* `eyebrow` is the one prop that never comes from the dictionary:
                the uppercase Latin kicker is a typographic device and reads
                identically on /about and /en/about. Same for the other three
                sections below. */}
            <SectionTitle
              no="01"
              eyebrow="OUR HISTORY"
              heading={t.history.heading}
              description={t.history.description}
            />
            <div className="history-layout">
              {/* `.history-image` is a bare <div>, and its caption is a direct
                  <p> child (`.history-image p` sets the italic serif style). */}
              <div className="history-image">
                <img
                  src="/images/about/building-exterior.jpg"
                  alt={t.history.imageAlt}
                />
                <p>{t.history.imageCaption}</p>
              </div>
              {/* <ol><li><strong> + <div> is load-bearing: `.timeline li` is a
                  100px/1fr grid whose first column is the <strong>. */}
              <ol className="timeline">
                {t.history.milestones.map((item) => (
                  <li key={item.year}>
                    <strong>{item.year}</strong>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="inner-section tint" id="section-2">
          <div className="container">
            <SectionTitle
              no="02"
              eyebrow="MISSION & VISION"
              heading={t.mission.heading}
            />
            <blockquote className="mission-quote">{t.mission.quote}</blockquote>
            {/* Cards must be <article>: `.principle-grid article` carries the
                border / min-height / padding, and the divider fix-ups are
                :nth-child(3) and :last-child. */}
            <div className="principle-grid">
              {t.mission.principles.map((item) => (
                <article key={item.no}>
                  <span>{item.no}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section" id="section-3">
          <div className="container">
            <SectionTitle
              no="03"
              eyebrow="HONORS"
              heading={t.honors.heading}
            />
            <div className="honor-grid">
              {t.honors.items.map((item) => (
                <article key={item.label}>
                  <strong>{item.label}</strong>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section photo-band" id="section-4">
          <div className="container">
            <SectionTitle
              no="04"
              eyebrow="ENVIRONMENT"
              heading={t.environment.heading}
            />
            {/* <figure>/<figcaption> can't be swapped for <div>s —
                `.about-photo-grid figure/img/figcaption` is the only hook. */}
            <div className="about-photo-grid">
              {t.environment.photos.map((photo) => (
                <figure
                  key={photo.src}
                  className={photo.wide ? "about-photo-wide" : undefined}
                >
                  <img src={photo.src} alt={photo.alt} />
                  <figcaption>{photo.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      </div>

      <NextRoute lang={lang} />
    </SiteShell>
  );
}
