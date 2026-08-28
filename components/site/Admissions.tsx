import type { LinkItem, Program } from "@/lib/data";
import { translate, type Lang } from "@/lib/i18n";
import { ADMISSIONS } from "@/lib/i18n/admissions";
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";
import { padNo } from "./nav";

/**
 * 招生資訊 (/admissions) — route 05 / 08.
 *
 * Data sources, per PORT-REPORT §2.3:
 *
 *   #section-1 `.program-grid`     B → getPrograms()  (4 rows, already trimmed
 *                                  from 5 — 國際專班 was dropped in the 2026 IA)
 *   #section-2 `.schedule-line`    B, but there is no table and no getter for
 *                                  it (§2.4). Hard-coded here on purpose: the
 *                                  grid is a fixed repeat(4,1fr) → repeat(2,1fr)
 *                                  → 1fr ladder and every article draws its own
 *                                  right/bottom border, so a 5th entry breaks
 *                                  the 1180px row without looking wrong at
 *                                  1440px. Adding a table is out of scope here.
 *   #section-3 `.capability-cloud` A, static tag cloud.
 *   #section-4 `.resource-row`     B → getLinks(). See the fallback below.
 *
 * All A-class copy lives in lib/i18n/admissions.ts.
 *
 * Layout traps in site.css for this page:
 *   .program-grid article  — cards must be <article>; the borders, the 450px
 *                            min-height and the padding all hang off that tag,
 *                            and `article:first-child{border-left}` +
 *                            `article:nth-child(3){border-left}` (≤1180px)
 *                            assume exactly 4 cards in a 4→2→1 column ladder.
 *   .program-grid article>span — direct child selector for the card number.
 *   .schedule-line article — same story with #ffffff3d borders on green.
 *   .resource-row a        — the border/min-height/flex live on the <a>. A row
 *                            rendered as <div> would lose all of it, so every
 *                            entry stays an anchor even when its url is "#".
 */

export function Admissions({
  lang,
  programs,
  links,
}: {
  lang: Lang;
  /** getPrograms() — 4 學制, in sort_order. */
  programs: Program[];
  /** getLinks('admissions') — 4 resource cards. Empty until the rows exist. */
  links: LinkItem[];
}) {
  const t = translate(ADMISSIONS, lang);

  // Same guard as the home page: the grid's positional border rules assume at
  // most 4 cards, so extra rows are dropped rather than allowed to break the
  // 1180px layout.
  const cards = programs.slice(0, 4);
  // DB rows arrive from lib/data.ts already resolved to the page's language;
  // the fallback comes from the dictionary. Either way `label` is ready to
  // print and must not be translated again here.
  const resources = links.length
    ? links.map((link) => ({ label: link.label, url: link.url ?? "#" }))
    : t.section4.resourcesFallback;

  return (
    <SiteShell lang={lang} variant="interior">
      <InteriorHero
        lang={lang}
        slug="admissions"
        titleZh={ADMISSIONS.title.zh}
        titleEn={ADMISSIONS.title.en}
        routeNo="05"
        lead={t.hero.lead}
        imageAlt={t.hero.imageAlt}
      />

      <LocalNav lang={lang} label={t.nav.label} items={t.nav.items} />

      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            <SectionTitle
              no="01"
              eyebrow="PROGRAMS"
              heading={t.section1.heading}
              description={t.section1.description}
            />
            <div className="program-grid">
              {cards.map((program, i) => {
                // Matched on `name_zh`, never `name`: the dictionary is keyed
                // by the Chinese program name, while `name` is the translated
                // display name and would match nothing on /en — every card
                // would silently fall back to `description` twice over.
                const copy = t.programs.find(
                  (entry) => entry.match === program.name_zh
                );
                return (
                  <article key={program.id}>
                    <span>{padNo(i + 1)}</span>
                    {/* The kicker above the heading is the program's name in
                        the *other* language — the same rule InteriorHero uses
                        for its title, and why `Program` exposes `name_en`
                        alongside the already-resolved `name`. Null `name_en`
                        renders an empty <small>, as it did before /en existed. */}
                    <small>
                      {lang === "en" ? program.name_zh : program.name_en}
                    </small>
                    <h3>{program.name}</h3>
                    <h4>{copy?.tagline ?? program.description}</h4>
                    <p>{copy?.methods ?? program.description}</p>
                    <a href="#section-2">{t.section1.cta}</a>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="inner-section schedule-section" id="section-2">
          <div className="container">
            <SectionTitle
              no="02"
              eyebrow="KEY DATES"
              heading={t.section2.heading}
            />
            <div className="schedule-line">
              {t.keyDates.map((date) => (
                <article key={date.code}>
                  <strong>{date.code}</strong>
                  <span>{date.month}</span>
                  <p>{date.body}</p>
                </article>
              ))}
            </div>
            <p className="schedule-note">{t.section2.note}</p>
          </div>
        </section>

        <section className="inner-section" id="section-3">
          <div className="container">
            <SectionTitle
              no="03"
              eyebrow="WHAT YOU WILL BUILD"
              heading={t.section3.heading}
            />
            <div className="capability-cloud">
              {t.section3.capabilities.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section tint" id="section-4">
          <div className="container">
            <SectionTitle
              no="04"
              eyebrow="NEED HELP?"
              heading={t.section4.heading}
            />
            {/* Anchors, never <div>s — `.resource-row a` owns the cell border,
                the 120px min-height and the flex alignment. */}
            <div className="resource-row">
              {resources.map((resource) => (
                <a href={resource.url} key={resource.label}>
                  {resource.label} <span>↗︎</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>

      <NextRoute lang={lang} />
    </SiteShell>
  );
}
