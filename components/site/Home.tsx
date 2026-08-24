import Link from "next/link";
import type { NewsItem, Program } from "@/lib/data";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { HOME, HOME_STATS, RESEARCH_AREAS } from "@/lib/i18n/home";
import { SiteShell } from "./SiteShell";
import { HomeHero } from "./HomeHero";
import { formatNewsDate } from "./format";
import { padNo } from "./nav";

/**
 * 首頁 (/, /en) — the only page with its own layout; the other 7 share
 * `.interior-page`.
 *
 * Section ids are deliberately offset from their content (`#about` on the intro
 * band, `#people` on the campus band, `#courses`/`#students` on two of the
 * `.admissions-links` anchors). That's what makes the menu overlay and the
 * institution bar's utility anchors all land somewhere on this page — don't
 * "tidy" them.
 *
 * Static copy is A-class and lives in lib/i18n/home.ts. Two blocks read the DB
 * (B-class): `.feature-story` + `.news-list` from getNewsHome,
 * `.admission-grid` from getPrograms.
 */
export function Home({
  lang,
  newsHome,
  programs,
}: {
  lang: Lang;
  newsHome: NewsItem[];
  programs: Program[];
}) {
  const t = translate(HOME, lang);
  const stats = translate(HOME_STATS, lang);
  const newsHref = localizePath("/news", lang);
  const [feature, ...rest] = newsHome;
  // `.admission-card` hard-assumes exactly four cards across four different
  // positional rules (last-child, nth-child(2), nth-child(-n+2), plus a 600px
  // override). A fifth program row would draw borders in the wrong places at
  // 1180px, so the home page shows the first four only.
  const cards = programs.slice(0, 4);

  return (
    <SiteShell lang={lang} variant="home">
      <HomeHero lang={lang} />

      <section className="intro section" id="about">
        <div className="container intro-grid">
          <div>
            <p className="eyebrow">{t.introEyebrow}</p>
            <span className="section-number">01</span>
          </div>
          <div>
            <h2>
              {t.introHeadingTop}
              <br />
              {t.introHeadingBottom}
            </h2>
            <div className="intro-body">
              <p>{t.introBody}</p>
              <a className="inline-link" href="#research">
                {t.introLink} <span>↗</span>
              </a>
            </div>
          </div>
        </div>
        {/* Bare <div> children: site.css draws every column divider through
            `.stat-row div` + positional selectors. A <StatItem> component that
            emitted an extra wrapper, or <li>s, would silently lose all of it. */}
        <div className="container stat-row" aria-label={t.statsLabel}>
          {stats.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="news-section section" id="news">
        <div className="container section-heading-row">
          <div>
            <p className="eyebrow">{t.newsEyebrow}</p>
            <h2>
              {t.newsHeadingTop}
              <br />
              {t.newsHeadingBottom}
            </h2>
          </div>
          <Link
            className="circle-link"
            href={newsHref}
            aria-label={t.newsAllLabel}
          >
            {t.newsAllTop}
            <br />
            {t.newsAllBottom}
          </Link>
        </div>
        <div className="container news-layout" id="news-list">
          {feature ? (
            <article className="feature-story">
              {/* Direct <img> child — `.feature-story img` positions it
                  absolutely as the full-bleed background. */}
              <img
                src={feature.cover_url ?? "/images/auditorium.jpg"}
                alt={feature.cover_url ? feature.title : t.newsFeatureAlt}
              />
              <div className="feature-overlay">
                {/* `FEATURED` is the reference site's own Latin-caps label on
                    both sites; the category beside it arrives translated. */}
                <p>FEATURED · {feature.category}</p>
                <h3>{feature.title}</h3>
                <Link href={newsHref}>
                  {t.newsFeatureLink} <span>→</span>
                </Link>
              </div>
            </article>
          ) : null}
          <div className="news-list">
            {rest.map((item) => {
              const date = formatNewsDate(item.published_at);
              return (
                <Link className="news-item" href={newsHref} key={item.id}>
                  {/* `.news-item time strong` / `time span` — the <time> needs
                      exactly these two element children. */}
                  <time dateTime={item.published_at.slice(0, 10)}>
                    <strong>{date.monthDay}</strong>
                    <span>{date.year}</span>
                  </time>
                  <div>
                    <span className="tag">{item.category}</span>
                    <h3>{item.title}</h3>
                  </div>
                  <span className="news-arrow">↗</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="research section" id="research">
        <div className="container research-intro">
          <p className="eyebrow light">{t.researchEyebrow}</p>
          <h2>
            {t.researchHeadingTop}
            <br />
            {t.researchHeadingBottom}
          </h2>
          <p>{t.researchBody}</p>
        </div>
        <div className="container research-list">
          {RESEARCH_AREAS.map((area, i) => (
            // Both languages are on screen at once, so this row is a swap, not
            // a lookup: `<h3>` takes the page's language and `<p>` the other.
            // The key stays the Chinese string, which is the stable identity.
            <a href="#research" className="research-item" key={area.zh}>
              <span>{padNo(i + 1)}</span>
              <h3>{lang === "en" ? area.en : area.zh}</h3>
              <p>{lang === "en" ? area.zh : area.en}</p>
              <i>↗</i>
            </a>
          ))}
        </div>
      </section>

      <section className="admissions section" id="admissions">
        <div className="container admissions-heading">
          <div>
            <p className="eyebrow">{t.admissionsEyebrow}</p>
            <h2>
              {t.admissionsHeadingTop}
              <br />
              {t.admissionsHeadingBottom}
            </h2>
          </div>
          <p>{t.admissionsBody}</p>
        </div>
        <div className="container admission-grid">
          {cards.map((program, i) => {
            // `.admission-card small` is the 9px Latin-caps kicker above the
            // programme name — the counterpart language, not a translation of
            // the <h3> below it. `Program` therefore exposes all three of
            // `name` (resolved), `name_zh` and `name_en`, the same exception
            // `Faculty.name_en` gets: pick whichever one the <h3> is not
            // showing. Null when that field is empty, so the <small> is
            // dropped rather than rendered blank.
            const kicker = lang === "en" ? program.name_zh : program.name_en;
            return (
              <a className="admission-card" href="#admissions" key={program.id}>
                <span className="card-no">{padNo(i + 1)}</span>
                <div>
                  {kicker ? <small>{kicker}</small> : null}
                  <h3>{program.name}</h3>
                  <p>{program.description}</p>
                </div>
                <span className="card-arrow">→</span>
              </a>
            );
          })}
        </div>
        {/* The first two are nav routes carrying the `#courses` / `#students`
            anchor targets the menu overlay links to. */}
        <div className="container admissions-links">
          <Link href={localizePath("/courses", lang)} id="courses">
            {t.admissionsCourses}
          </Link>
          <Link href={localizePath("/students", lang)} id="students">
            {t.admissionsStudents}
          </Link>
          <Link href={localizePath("/admissions", lang)}>
            {t.admissionsSchedule}
          </Link>
        </div>
      </section>

      <section className="campus section" id="people">
        <div className="container campus-grid">
          <div className="campus-copy">
            <p className="eyebrow">{t.campusEyebrow}</p>
            <h2>
              {t.campusHeadingTop}
              <br />
              {t.campusHeadingBottom}
            </h2>
            <p>{t.campusBody}</p>
            <Link className="button dark" href={localizePath("/faculty", lang)}>
              {t.campusCta} <span>↗</span>
            </Link>
          </div>
          {/* <figure>/<figcaption> are load-bearing: `.campus figure` and
              `.campus figure img` are the only selectors that reach these. */}
          <figure className="campus-main">
            <img src="/images/building.jpg" alt={t.campusMainAlt} />
          </figure>
          <figure className="campus-small">
            <img src="/images/office.jpg" alt={t.campusSmallAlt} />
          </figure>
          {/* Coordinates and the university's English name: identical on both
              sites, so they stay out of the dictionary. */}
          <div className="campus-note">
            <span>25.0173° N</span>
            <span>121.5398° E</span>
            <p>
              National Taiwan University
              <br />
              Taipei, Taiwan
            </p>
          </div>
        </div>
      </section>

      <section className="closing" id="alumni">
        {/* `.closing>img` — must stay a direct child or it stops being the
            absolutely-positioned backdrop and renders inline. */}
        <img src="/images/home-closing-agec.jpg" alt={t.closingImageAlt} />
        <div className="container closing-content">
          {/* Latin-caps kicker with no Chinese half: the same on both sites. */}
          <p className="eyebrow light">FROM NTU TO THE WORLD</p>
          <h2>
            {t.closingHeadingTop}
            <br />
            {t.closingHeadingBottom}
          </h2>
          <div>
            <Link
              className="button gold"
              href={localizePath("/admissions", lang)}
            >
              {t.closingJoin} <span>↗</span>
            </Link>
            <Link
              className="text-action light-action"
              href={localizePath("/alumni", lang)}
            >
              {t.closingAlumni} <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
