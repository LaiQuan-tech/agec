import type { NewsItem } from "@/lib/data";
import { translate, type Lang } from "@/lib/i18n";
import {
  NEWS,
  NEWS_FILTER_TABS,
  NEWS_LOCAL_NAV,
  NEWS_TITLE,
} from "@/lib/i18n/news";
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { FilterTabs } from "./FilterTabs";
import { NextRoute } from "./NextRoute";
import { formatNewsDate } from "./format";

/**
 * 最新消息 (/news, /en/news) — route 02 / 08.
 *
 * The page is a single `.inner-section#section-1`: hero + local nav + section
 * title (A-class static copy, in lib/i18n/news.ts), then one B-class block
 * reading getNews() — `article.inner-news-feature` for the first row and
 * `.inner-news-list` for the rest — wrapped by two C-class controls that are
 * cosmetic on the reference site (see the two comments below).
 */

/** Reference feature image, used whenever the first row has no cover_url. */
const FEATURE_FALLBACK_IMAGE = "/images/courtyard.jpg";

export function News({ lang, news }: { lang: Lang; news: NewsItem[] }) {
  const t = translate(NEWS, lang);
  const [feature, ...rest] = news;

  return (
    <SiteShell lang={lang} variant="interior">
      <InteriorHero
        lang={lang}
        slug="news"
        titleZh={NEWS_TITLE.zh}
        titleEn={NEWS_TITLE.en}
        routeNo="02"
        lead={t.lead}
        imageAlt={t.heroAlt}
      />
      <LocalNav
        lang={lang}
        label={t.localNavLabel}
        items={translate(NEWS_LOCAL_NAV, lang)}
      />
      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            {/* `eyebrow` stays English on both sites — it is the reference
                site's Latin-caps device, not copy. */}
            <SectionTitle
              no="01"
              eyebrow="LATEST UPDATES"
              heading={t.sectionHeading}
              description={t.sectionDescription}
            />
            {/* Cosmetic only — no `onChange`. See FilterTabs. */}
            <FilterTabs
              tabs={translate(NEWS_FILTER_TABS, lang)}
              ariaLabel={t.filterLabel}
            />
            <div className="inner-news-layout">
              {feature ? (
                <article className="inner-news-feature">
                  {/* Direct <img> child: `.inner-news-feature>img` is what
                      absolutely positions it as the full-bleed backdrop. Wrap it
                      and the card collapses to an inline image. */}
                  <img
                    src={feature.cover_url ?? FEATURE_FALLBACK_IMAGE}
                    alt={feature.cover_url ? feature.title : t.featureAlt}
                  />
                  {/* Also a direct <div> child, for the same reason. */}
                  <div>
                    {/* The date keeps its YYYY.MM.DD form on both sites: it is
                        set as a Latin-caps run beside `FEATURED ·`, and a
                        localised "Jan 5, 2026" would break that alignment. */}
                    <span>
                      FEATURED · {formatNewsDate(feature.published_at).full}
                    </span>
                    <h3>{feature.title}</h3>
                    {/* The reference card carries a standfirst here. `body` is
                        the matching column and is null for every current row —
                        the paragraph is dropped rather than filled with invented
                        copy, since this is a real department's public site. */}
                    {feature.body ? <p>{feature.body}</p> : null}
                    {/* href="#" as on the reference site: neither site has a
                        single-post page. */}
                    <a href="#">{t.featureLink}</a>
                  </div>
                </article>
              ) : null}
              {/* `.inner-news-list>a` is a 4-column grid (date / category /
                  title / arrow) that collapses to 3 at 600px by hiding the
                  <span>. No :nth-child rules, so the row count is free. */}
              <div className="inner-news-list">
                {rest.map((item) => (
                  <a href="#" key={item.id}>
                    <time dateTime={item.published_at.slice(0, 10)}>
                      {formatNewsDate(item.published_at).full}
                    </time>
                    <span>{item.category}</span>
                    <h3>{item.title}</h3>
                    <i>↗</i>
                  </a>
                ))}
              </div>
            </div>
            {/* Decorative page numbers. The reference site ships exactly this
                markup with zero JavaScript behind it — 02 / 03 / 下一頁 do
                nothing when clicked. Reproduced as-is. */}
            <nav className="pagination" aria-label={t.paginationLabel}>
              <span>01</span>
              <a href="#">02</a>
              <a href="#">03</a>
              <a href="#">{t.paginationNext}</a>
            </nav>
          </div>
        </section>
      </div>
      <NextRoute lang={lang} />
    </SiteShell>
  );
}
