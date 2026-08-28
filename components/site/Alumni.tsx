import { translate, type Lang } from "@/lib/i18n";
import { ALUMNI } from "@/lib/i18n/alumni";
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";
import { MaybeLink } from "./MaybeLink";

/**
 * 系友專區 (/alumni) — route 08 / 08.
 *
 * All four sections are hard-coded A-class copy, held in lib/i18n/alumni.ts.
 * Two of them need explaining:
 *
 *   `#section-2` `.story-grid` — PORT-REPORT §2.3 marks this B-class
 *   (`getLinks("alumni")`) but flags 形狀不符, and the mismatch is fatal rather
 *   than cosmetic:
 *     - a card is `<a><small>eyebrow</small><h3>title</h3><span>action</span></a>`,
 *       while `links` only stores `label` / `url` / `sort_order` — the
 *       `eyebrow` and `action_label` columns do not exist (§2.4 table).
 *     - the three cards are not one homogeneous list: card 1 is a dated news
 *       item (`2026.07.06 · 系友榮耀`), cards 2–3 are CTAs whose eyebrows are
 *       English labels, so no single column could feed all three.
 *     - `.story-grid{grid-template-columns:repeat(3,1fr)}` is a fixed 3-up grid
 *       and `.story-grid a{min-height:300px}` + `.story-grid h3{margin:70px 0 20px}`
 *       assume all three children exist; the `alumni` section currently holds 2
 *       rows, which would leave a hole in the row and drop the card heights.
 *   So this is written as static copy, same reasoning as `.schedule-line` /
 *   `ol.timeline` elsewhere in the port.
 *
 *   `#section-3` — the only章節 in the whole site with no
 *   `header.inner-section-title`; the section's `.container` carries
 *   `.donation-grid` directly. Do not add a SectionTitle here.
 *
 * The three headings the reference site breaks across two lines keep their
 * `<br />` in both languages, so each is two dictionary entries rather than
 * one string — English would not break where Chinese does.
 */

/**
 * `.alumni-sectors` — 5 tags; `grid-template-columns:repeat(5,1fr)`.
 * Not in the dictionary: uppercase Latin in the reference design, identical in
 * both languages, exactly like `SectionTitle`'s eyebrow.
 */
/**
 * 「前往捐贈專區」 and the 系友捐贈 link both land here.
 *
 * NTU's own giving site, not a department page: 農經系 runs no donation channel
 * of its own — there is no giving page anywhere under agec.ntu.edu.tw, and the
 * current official site sends donors to the university as well.
 */
const GIVING_URL = "https://giving.ntu.edu.tw/Default.html";

const SECTORS = [
  "GOVERNMENT",
  "ACADEMIA",
  "FINANCE",
  "AGRIBUSINESS",
  "INTERNATIONAL",
];

export function Alumni({ lang }: { lang: Lang }) {
  const t = translate(ALUMNI, lang);

  return (
    <SiteShell lang={lang} variant="interior">
      <InteriorHero
        lang={lang}
        slug="alumni"
        titleZh={ALUMNI.title.zh}
        titleEn={ALUMNI.title.en}
        routeNo="08"
        lead={t.hero.lead}
        imageAlt={t.hero.imageAlt}
      />

      <LocalNav lang={lang} label={t.nav.label} items={t.nav.items} />

      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            <SectionTitle
              no="01"
              eyebrow="DISTINGUISHED ALUMNI"
              heading={
                <>
                  {t.section1.heading.line1}
                  <br />
                  {t.section1.heading.line2}
                </>
              }
              description={t.section1.description}
            />
            {/* Exactly two children: `.alumni-feature` is a .85fr/1.15fr grid
                whose text column is addressed as `.alumni-feature>div` and whose
                photo must be a direct `<img>` child, not wrapped. */}
            <div className="alumni-feature">
              <div>
                <span>PUBLIC LEADERSHIP</span>
                <h3>
                  {t.section1.feature.heading.line1}
                  <br />
                  {t.section1.feature.heading.line2}
                </h3>
                <p>{t.section1.feature.body}</p>
                {/* 「探索系友故事」 has no destination — the reference site
                    left it as href="#" and there is no alumni-story page or
                    table to point at. Inert rather than pretending. */}
                <MaybeLink href={null} arrow={<span> →</span>}>
                  {t.section1.feature.cta}
                </MaybeLink>
              </div>
              <img
                src="/images/building.jpg"
                alt={t.section1.feature.imageAlt}
              />
            </div>
            <div className="alumni-sectors">
              {SECTORS.map((sector) => (
                <span key={sector}>{sector}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section tint" id="section-2">
          <div className="container">
            {/* No description on this one — the reference site's second <div>
                holds only the <h2>. */}
            <SectionTitle
              no="02"
              eyebrow="ALUMNI NEWS"
              heading={t.section2.heading}
            />
            <div className="story-grid">
              {t.section2.stories.map((story) => (
                // Two of the three still have nowhere to go — see the note on
                // `stories` in lib/i18n/alumni.ts. Give one a url — a `links`
                // row, or a story table — and it becomes a real link without
                // touching this markup.
                <MaybeLink
                  key={story.title}
                  href={story.url}
                  // `.story-grid span` is `margin-top:auto` — the card's call
                  // to action pinned to its foot. "閱讀消息" with nothing to
                  // read is the misleading half, so it goes with the link.
                  arrow={<span>{story.action} ↗︎</span>}
                >
                  <small>{story.eyebrow}</small>
                  <h3>{story.title}</h3>
                </MaybeLink>
              ))}
            </div>
          </div>
        </section>

        {/* The one section with no `header.inner-section-title`: `.donation-grid`
            is a class on the `.container` itself. */}
        <section className="inner-section donation-section" id="section-3">
          <div className="container donation-grid">
            <div>
              <p className="eyebrow light">SUPPORT AGEC</p>
              <h2>
                {t.section3.heading.line1}
                <br />
                {t.section3.heading.line2}
              </h2>
            </div>
            <div>
              <p>{t.section3.body}</p>
              <MaybeLink
                className="button gold"
                href={GIVING_URL}
                arrow={<span> ↗︎</span>}
              >
                {t.section3.cta}
              </MaybeLink>
            </div>
          </div>
        </section>

        <section className="inner-section" id="section-4">
          <div className="container">
            <SectionTitle
              no="04"
              eyebrow="LEE TENG-HUI ARCHIVE"
              heading={t.section4.heading}
              description={t.section4.description}
            />
            {/* `<article>` is the only selector `.archive-grid` uses for its
                cards (border / min-height / padding all hang off it). */}
            <div className="archive-grid">
              {t.section4.items.map((item) => (
                <article key={item.no}>
                  <span>{item.no}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      <NextRoute lang={lang} />
    </SiteShell>
  );
}
