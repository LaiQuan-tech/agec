import Link from "next/link";
import type { NewsItem, NewsPage } from "@/lib/data";
import { localizePath, translate, type Lang } from "@/lib/i18n";
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
 * Two `.inner-section`s. `#section-1` is the reference site's whole page:
 * hero + local nav + section title (A-class static copy, in lib/i18n/news.ts),
 * then one B-class block reading getNewsPage() — `article.inner-news-feature` for
 * the first row and `.inner-news-list` for the rest — wrapped by two C-class
 * controls that are cosmetic on the reference site (see the comments below).
 *
 * `#section-2` is an addition: 演講公告 rows were pulled out of that list into
 * their own block at the client's request. It takes the id the local nav's
 * 演講 / Talks anchor was already pointing at (the reference left it dead), and
 * disappears entirely when there are no talks rather than rendering an empty
 * container.
 */

/** Reference feature image, used whenever the first row has no cover_url. */
const FEATURE_FALLBACK_IMAGE = "/images/courtyard.jpg";

/**
 * Page 1 lives at /news, the rest at /news/page/N.
 *
 * Path segments rather than `?page=N`: reading searchParams would make this
 * route dynamic, and every other page on the site is statically prerendered
 * with ISR. `/news/page/2` also does not collide with `/news/[id]` — a static
 * segment wins over a dynamic sibling, and the two have different depths.
 */
function newsPagePath(page: number, lang: Lang): string {
  return localizePath(page === 1 ? "/news" : `/news/page/${page}`, lang);
}

export function News({
  lang,
  newsPage,
  talks,
}: {
  lang: Lang;
  newsPage: NewsPage;
  talks: NewsItem[];
}) {
  const t = translate(NEWS, lang);
  const { items, page, totalPages } = newsPage;

  /**
   * The feature card is the newest item, so it only belongs on page 1 — a card
   * labelled `FEATURED` holding the 9th-newest announcement would be a lie.
   * Later pages are a plain full-width list.
   *
   * The talks split happens in lib/data.ts rather than here, because it decides
   * the page count as well as the contents.
   */
  const feature = page === 1 ? items[0] : undefined;
  const rest = page === 1 ? items.slice(1) : items;

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
                    <Link href={localizePath(`/news/${feature.id}`, lang)}>
                      {t.featureLink}
                    </Link>
                  </div>
                </article>
              ) : null}
              {/* `.inner-news-list>a` is a 4-column grid (date / category /
                  title / arrow) that collapses to 3 at 600px by hiding the
                  <span>. No :nth-child rules, so the row count is free. */}
              <div className="inner-news-list">
                {rest.map((item) => (
                  <Link
                    href={localizePath(`/news/${item.id}`, lang)}
                    key={item.id}
                  >
                    <time dateTime={item.published_at.slice(0, 10)}>
                      {formatNewsDate(item.published_at).full}
                    </time>
                    <span>{item.category}</span>
                    <h3>{item.title}</h3>
                    <i>↗︎</i>
                  </Link>
                ))}
              </div>
            </div>
            {/* /blog is not in the site-wide nav (adding a ninth route would
                renumber every interior hero's "NN / 08"), so this and the
                footer are how a reader finds it. Longer pieces live there;
                this page is announcements. */}
            <p className="news-to-blog">
              <Link className="text-action" href={localizePath("/blog", lang)}>
                {t.toBlog} <span>→</span>
              </Link>
            </p>
            {/* The reference site ships this row as decoration — 01/02/03 and
                下一頁 with no JavaScript behind them, all `href="#"`, so
                clicking one jumped to the top of the page. It is real now:
                `.pagination` supplies the type and the right alignment, and
                the links are ordinary routes, so it still needs no client JS.

                Hidden entirely at one page rather than rendered as a lone
                "01" — a control that cannot do anything is worse than no
                control. */}
            {totalPages > 1 ? (
              <nav className="pagination" aria-label={t.paginationLabel}>
                {page > 1 ? (
                  <Link href={newsPagePath(page - 1, lang)}>
                    {t.paginationPrev}
                  </Link>
                ) : null}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) =>
                  n === page ? (
                    // `.pagination span` is the current-page style in site.css.
                    <span key={n} aria-current="page">
                      {String(n).padStart(2, "0")}
                    </span>
                  ) : (
                    <Link
                      key={n}
                      href={newsPagePath(n, lang)}
                      aria-label={t.paginationPage.replace("{n}", String(n))}
                    >
                      {String(n).padStart(2, "0")}
                    </Link>
                  )
                )}
                {page < totalPages ? (
                  <Link href={newsPagePath(page + 1, lang)}>
                    {t.paginationNext}
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </div>
        </section>

        {/* Page 1 only. The talks block is not paginated — it is the whole
            set, every time — so repeating it under page 2's list would show
            the same items again and put one panel at two URLs. LocalNav drops
            its 演講 anchor by itself when the section is absent. */}
        {page === 1 && talks.length > 0 ? (
          <section className="inner-section tint" id="section-2">
            <div className="container">
              <SectionTitle
                no="02"
                eyebrow="TALKS & SEMINARS"
                heading={t.talksHeading}
                description={t.talksDescription}
              />
              {/* Same `.inner-news-list` rows as `#section-1`, but without the
                  `.inner-news-layout` wrapper — that is the two-column grid
                  holding the feature card, and there is no feature here, so the
                  list runs the full width of the container. */}
              <div className="inner-news-list">
                {talks.map((item) => (
                  <Link
                    href={localizePath(`/news/${item.id}`, lang)}
                    key={item.id}
                  >
                    <time dateTime={item.published_at.slice(0, 10)}>
                      {formatNewsDate(item.published_at).full}
                    </time>
                    <span>{item.category}</span>
                    <h3>{item.title}</h3>
                    <i>↗︎</i>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
      <NextRoute lang={lang} />
    </SiteShell>
  );
}
