import Link from "next/link";
import type { NewsItem, NewsPage, NewsYear } from "@/lib/data";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import {
  NEWS,
  NEWS_CATEGORY_PAGES,
  NEWS_FILTER_TABS,
  NEWS_LOCAL_NAV,
  NEWS_TITLE,
} from "@/lib/i18n/news";
import { EYEBROWS } from "@/lib/i18n/eyebrows";
import { newsPath, slugForCategory } from "@/lib/news-categories";
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { FilterTabLinks } from "./FilterTabLinks";
import { NewsYearNav } from "./NewsYearNav";
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

/**
 * The first tab's `value`, which means "no filter" rather than a category.
 *
 * Chinese in both languages, like every other value in NEWS_FILTER_TABS: those
 * are matched against `news.category`, which is always the Chinese string. This
 * one matches nothing on purpose — it is the sentinel, so it must not be
 * translated either, or /en's first tab would stop being recognised as "all".
 */
const ALL_TABS_VALUE = "全部";

/** Reference feature image, used whenever the first row has no cover_url. */
const FEATURE_FALLBACK_IMAGE = "/images/courtyard.jpg";

/*
 * The path helpers moved to lib/news-categories.ts when the tabs started
 * navigating: the tab hrefs and the pagination hrefs must come from one
 * function, or a tab can end up linking to the page the reader is already on.
 */

export function News({
  lang,
  newsPage,
  talks,
  talkCount,
  category,
  year,
  years,
}: {
  lang: Lang;
  newsPage: NewsPage;
  /** The most recent few, not all of them — see `talkCount`. Empty when
   *  filtered: a category page is one list, not the whole front page. */
  talks: NewsItem[];
  /** How many talks exist in total, for the link to the archive. */
  talkCount: number;
  /**
   * The `news.category` this page is filtered to, or undefined for /news.
   * Drives the heading, the active tab and every link on the page.
   */
  category?: string;
  /** 篩選的年份，undefined 表示全部年份。 */
  year?: number;
  /** 這個分類下實際有消息的年份，新到舊。年份列從這裡來。 */
  years: NewsYear[];
}) {
  const t = translate(NEWS, lang);
  const eb = translate(EYEBROWS, lang);
  const { items, page, totalPages } = newsPage;
  const slug = category ? slugForCategory(category) : null;
  const filtered = Boolean(category || year);
  const copy = slug
    ? translate(NEWS_CATEGORY_PAGES[slug as keyof typeof NEWS_CATEGORY_PAGES], lang)
    : null;

  /**
   * The feature card is the newest item, so it only belongs on page 1 — a card
   * labelled `FEATURED` holding the 9th-newest announcement would be a lie.
   * Later pages are a plain full-width list.
   *
   * Filtered pages get none either, for the same reason one step out: the newest
   * 招生 notice is not the newest thing the department has said, and `FEATURED`
   * would be claiming it is.
   *
   * The talks split happens in lib/data.ts rather than here, because it decides
   * the page count as well as the contents.
   */
  const feature = page === 1 && !filtered ? items[0] : undefined;
  const rest = feature ? items.slice(1) : items;

  return (
    <SiteShell lang={lang} variant="interior">
      <InteriorHero
        lang={lang}
        slug="news"
        titleZh={slug ? NEWS_CATEGORY_PAGES[slug as keyof typeof NEWS_CATEGORY_PAGES].title.zh : NEWS_TITLE.zh}
        titleEn={slug ? NEWS_CATEGORY_PAGES[slug as keyof typeof NEWS_CATEGORY_PAGES].title.en : NEWS_TITLE.en}
        // No route number on a filtered view: it is one lens on route 02, not a
        // ninth route, and `NN / 08` is computed from lib/nav.ts. Same reasoning
        // as Talks.tsx.
        routeNo={filtered ? undefined : "02"}
        /* 只篩年份時沒有分類文案可用，用年份那一句補上，而不是印回未篩選的
           那段引言 —— 那會讓 /news/year/2020 讀起來像沒有被篩選。 */
        lead={
          copy
            ? copy.lead
            : year
              ? t.yearLead.replace("{year}", String(year))
              : t.lead
        }
        imageAlt={t.heroAlt}
      />
      {/* The strip is a table of contents for a page with several sections, and
          a filtered page is a single list — `#section-2` is not rendered, so
          LocalNav would collapse to one item that navigates nowhere. */}
      {filtered ? null : (
        <LocalNav
          lang={lang}
          label={t.localNavLabel}
          items={translate(NEWS_LOCAL_NAV, lang)}
        />
      )}
      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            <SectionTitle
              no="01"
              eyebrow={eb.latestUpdates}
              heading={copy ? copy.heading : t.sectionHeading}
              description={copy ? copy.description : t.sectionDescription}
            />
            {/* Navigation, not a toggle — one URL per category. Rendered on
                filtered pages too: without it 「全部」 is only reachable with
                the browser's back button. */}
            <FilterTabLinks
              tabs={translate(NEWS_FILTER_TABS, lang)}
              activeValue={category ?? ALL_TABS_VALUE}
              /* 換分類時保留年份。兩排若各自把對方清掉，讀者每縮小一次範圍
                 就會失去另一次 —— 那不是兩個篩選器，是兩個互相打架的開關。 */
              hrefFor={(value) =>
                newsPath(
                  1,
                  lang,
                  value === ALL_TABS_VALUE ? null : slugForCategory(value),
                  year
                )
              }
              ariaLabel={t.filterLabel}
            />
            {/* 年份列。`years` 已經是「這個分類底下真的有消息的年份」，所以
                在「招生」頁看到的年份跟在全部消息看到的可以不一樣，而且不會
                有點下去是空頁的連結。 */}
            <NewsYearNav
              lang={lang}
              years={years}
              activeYear={year ?? null}
              hrefFor={(y) => newsPath(1, lang, slug, y)}
            />
            {/* `.inner-news-layout` is a `.78fr 1.22fr` grid: the feature card
                on the left, the list on the right. The card only exists on page
                one, so from page two the list was the grid's only child — and a
                lone child takes the *first* track, leaving the 1.22fr column
                empty. At 1920px that is a 552px list against 864px of nothing,
                on 21 of the 22 pages.

                Invisible until this table held more than one page of news.
                `#section-2` below drops the wrapper for the same reason.

                Fixed here rather than in CSS with `:has(> :only-child)`:
                site.css is frozen so the rule would have to live in
                site-extensions.css, where it would reach every other user of
                the class — and the condition is already known at render time. */}
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
            {rest.length === 0 && !feature ? (
              <p className="news-empty">
                {category ? t.categoryEmpty : t.yearEmpty}
              </p>
            ) : null}
            {/* 這裡原本還有一條「閱讀專欄文章 →」通往 /blog，已依需求移除。
                現在只剩篩選後的返回連結，所以整個 <p> 也只在有篩選時才渲染 ——
                留一個空的 <p> 會在列表與分頁之間多出 40px 的空白。 */}
            {filtered ? (
              <p className="news-list-action">
                <Link className="text-action" href={newsPath(1, lang)}>
                  {t.categoryBackToAll}
                </Link>
              </p>
            ) : null}
            <Pagination
              lang={lang}
              page={page}
              totalPages={totalPages}
              hrefFor={(n) => newsPath(n, lang, slug, year)}
            />
          </div>
        </section>

        {/* Page 1 only. Repeating the block under page 2's list would show
            the same items again and put one panel at two URLs. LocalNav drops
            its 演講 anchor by itself when the section is absent. */}
        {page === 1 && !category && talks.length > 0 ? (
          <section className="inner-section tint" id="section-2">
            <div className="container">
              <SectionTitle
                no="02"
                eyebrow={eb.talksSeminars}
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
                <p className="news-list-action">
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
