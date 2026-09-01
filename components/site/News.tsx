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
import { Pagination } from "./Pagination";
import { TalkList } from "./TalkList";
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
  talkCount,
}: {
  lang: Lang;
  newsPage: NewsPage;
  /** The most recent few, not all of them — see `talkCount`. */
  talks: NewsItem[];
  /** How many talks exist in total, for the link to the archive. */
  talkCount: number;
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
            {/* `.inner-news-layout` is a `.78fr 1.22fr` grid: the feature card
                on the left, the list on the right. The card only exists on page
                one, so from page two the list was the grid's only child — and a
                lone child takes the *first* track, leaving the 1.22fr column
                empty. At 1920px that is a 552px list against 864px of nothing,
                on 21 of the 22 pages.

                Invisible until this table held more than one page of news.
                Blog.tsx:64-71 already carries the mirror image of this fix (one
                post, feature but no list) with the same reasoning, and
                `#section-2` below drops the wrapper for the same reason.

                Fixed here rather than in CSS with `:has(> :only-child)`:
                site.css is frozen so the rule would have to live in
                site-extensions.css, where it would silently reach /blog too —
                and the condition is already known at render time. */}
            <div className={feature ? "inner-news-layout" : undefined}>
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
            <Pagination
              lang={lang}
              page={page}
              totalPages={totalPages}
              hrefFor={(n) => newsPagePath(n, lang)}
            />
          </div>
        </section>

        {/* Page 1 only. Repeating the block under page 2's list would show
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
              {/* Same rows as `#section-1`, but without the
                  `.inner-news-layout` wrapper — that is the two-column grid
                  holding the feature card, and there is no feature here, so the
                  list runs the full width of the container. */}
              <TalkList lang={lang} talks={talks} />
              {/* The block used to be every talk there was, which was fine at
                  one and absurd at 256 — nine years of mostly-expired notices
                  stacked under the announcements. It is a preview now, and this
                  is the way to the rest. Rendered only when there is a rest. */}
              {talkCount > talks.length ? (
                <p className="news-to-blog">
                  <Link className="text-action" href={localizePath("/news/talks", lang)}>
                    {t.talksAll.replace("{n}", String(talkCount))} <span>→</span>
                  </Link>
                </p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
      <NextRoute lang={lang} />
    </SiteShell>
  );
}
