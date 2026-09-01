import type { LinkItem } from "@/lib/data";
import { translate, type Lang } from "@/lib/i18n";
import { STUDENTS } from "@/lib/i18n/students";
import { EYEBROWS } from "@/lib/i18n/eyebrows";
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";
import { MaybeLink } from "./MaybeLink";

/** NTU's campus map, supplied by the client. Not a department page. */
const CAMPUS_MAP_URL = "https://map.ntu.edu.tw/";

/**
 * 學生專區 (/students) — route 07 / 08.
 *
 * Three of the four sections are static copy (A-class) and live in
 * lib/i18n/students.ts; only `.resource-row` in `#section-4` reads the DB via
 * getLinks("students").
 *
 * `.steps` and `.association-branches` are deliberately hard-coded. site.css
 * draws their dividers positionally:
 *   .steps article{border-right:0} + .steps article:last-child{border-right:1px}
 *   @1180 .steps{grid-template-columns:repeat(2,1fr)}
 *          .steps article:nth-child(3){border-left:1px}
 *   .association-branches article:first-child{border-left:1px}
 *   @1180 .association-branches{repeat(2,1fr)} … @600 {1fr}
 * A fifth step or a sixth branch would draw borders in the wrong cells at the
 * 1180px breakpoint while still looking correct on a desktop viewport — the
 * easiest kind of regression to miss. Keep these counts at 4 and 5.
 */

export function Students({ lang, links }: { lang: Lang; links: LinkItem[] }) {
  const t = translate(STUDENTS, lang);
  const eb = translate(EYEBROWS, lang);

  return (
    <SiteShell lang={lang} variant="interior">
      <InteriorHero
        lang={lang}
        slug="students"
        titleZh={STUDENTS.title.zh}
        titleEn={STUDENTS.title.en}
        routeNo="07"
        lead={t.hero.lead}
        imageAlt={t.hero.imageAlt}
      />
      <LocalNav lang={lang} label={t.nav.label} items={t.nav.items} />
      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            <SectionTitle
              no="01"
              eyebrow={eb.startHere}
              heading={t.section1.heading}
              description={t.section1.description}
            />
            {/* `.steps article` is the only card selector — no wrapper div. */}
            <div className="steps">
              {t.section1.steps.map((step) => (
                <article key={step.no}>
                  <span>{step.no}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="inner-section student-life" id="section-2">
          {/* `.student-life-grid>img` must stay a direct child: the two-column
              grid places the copy block and the photo as siblings. */}
          <div className="container student-life-grid">
            <div>
              <SectionTitle
                no="02"
                eyebrow={eb.campusLife}
                heading={t.section2.heading}
              />
              {/* Styled by `.student-life-grid>div>p` — a direct child only. */}
              <p>{t.section2.body}</p>
              {/* NTU's own campus map. External, so MaybeLink gives it a
                  plain <a target="_blank" rel="noopener noreferrer"> rather
                  than a next/link route. */}
              <MaybeLink
                className="button gold"
                href={CAMPUS_MAP_URL}
                arrow={<span> ↗︎</span>}
              >
                {t.section2.cta}
              </MaybeLink>
            </div>
            <img src="/images/hero.jpg" alt={t.section2.imageAlt} />
          </div>
        </section>

        <section className="inner-section" id="section-3">
          <div className="container">
            <SectionTitle
              no="03"
              eyebrow={eb.studentAssociation}
              heading={t.section3.heading}
            />
            <div className="association-chart">
              {/* `.leader:after` draws the 65px connector down to the branch
                  row, so the leader box has to be the first child here. */}
              <div className="leader">
                <h3>{t.section3.leader.title}</h3>
                <p>{t.section3.leader.body}</p>
              </div>
              <div className="association-branches">
                {t.section3.branches.map((branch) => (
                  <article key={branch.name}>
                    <h3>{branch.name}</h3>
                    <p>{branch.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="inner-section tint" id="section-4">
          <div className="container">
            <SectionTitle
              no="04"
              eyebrow={eb.quickAccess}
              heading={t.section4.heading}
            />
            {/* `.resource-row a` carries every border, min-height and hover
                state, so a row with no url still renders an <a> — MaybeLink
                removes only the href. `label` arrives from lib/data.ts already
                in the page's language. */}
            <div className="resource-row">
              {links.map((link) => (
                <MaybeLink
                  key={link.id}
                  href={link.url}
                  arrow={<span> ↗︎</span>}
                >
                  {link.label}
                </MaybeLink>
              ))}
            </div>
          </div>
        </section>
      </div>
      <NextRoute lang={lang} />
    </SiteShell>
  );
}
