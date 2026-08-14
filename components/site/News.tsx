import type { NewsItem } from "@/lib/data";
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { FilterTabs } from "./FilterTabs";
import { NextRoute } from "./NextRoute";
import { formatNewsDate } from "./format";

/**
 * 最新消息 (/news) — route 02 / 08.
 *
 * The page is a single `.inner-section#section-1`: hero + local nav + section
 * title (A-class static copy), then one B-class block reading getNews() —
 * `article.inner-news-feature` for the first row and `.inner-news-list` for the
 * rest — wrapped by two C-class controls that are cosmetic on the reference
 * site (see the two comments below).
 */

/**
 * The six `.filter-tabs` labels, copied verbatim from the reference markup
 * rather than derived from the data.
 *
 * They deliberately do NOT line up with `news.category`: the data also has
 * 榮譽/系友榮耀, which has no tab, and the data says 招生資訊 where the tab says
 * 招生. On the reference site the tabs never filter anything (site.js only moves
 * the `active` class), so the mismatch is invisible there — and deriving the
 * list from the rows instead would make this port render a different tab strip
 * from the original. PORT-REPORT §2.4 flags this as a decision to record: we
 * keep the reference's six.
 */
const FILTER_TABS = [
  "全部",
  "最新公告",
  "演講公告",
  "活動剪影",
  "招生",
  "求職徵才",
];

/**
 * `nav.local-nav` anchors, verbatim from the reference.
 *
 * Note #section-2 … #section-5 have no target — the page only renders
 * `#section-1`. That is the reference site's own behaviour (clicking those four
 * does nothing); don't "fix" it by inventing sections.
 */
const LOCAL_NAV = [
  { href: "#section-1", label: "全部消息" },
  { href: "#section-2", label: "演講" },
  { href: "#section-3", label: "活動花絮" },
  { href: "#section-4", label: "招生" },
  { href: "#section-5", label: "徵才" },
];

/** The reference feature card carries a one-line standfirst under its title.
 *  `news.body` is the matching column but is null for every seeded row, so this
 *  keeps the card's text stack the same height as the original. */
const FEATURE_LEAD = "本系最新公告與活動紀錄，點閱以掌握完整資訊。";

/** Reference feature image, used whenever the first row has no cover_url. */
const FEATURE_FALLBACK_IMAGE = "/images/courtyard.jpg";

export function News({ news }: { news: NewsItem[] }) {
  const [feature, ...rest] = news;

  return (
    <SiteShell variant="interior">
      <InteriorHero
        slug="news"
        title="最新消息"
        titleEn="News & Announcements"
        routeNo="02"
        lead="掌握本系公告、國際學術交流、活動紀錄與職涯機會，見證農經知識如何持續流動。"
        imageAlt="臺大農經系辦公空間"
      />
      <LocalNav label="最新消息" items={LOCAL_NAV} />
      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            <SectionTitle
              no="01"
              eyebrow="LATEST UPDATES"
              heading="最新動態"
              description="以清楚分類與時間排序，讓每一則重要資訊都能快速抵達需要的人。"
            />
            {/* Cosmetic only — no `onChange`. See FilterTabs. */}
            <FilterTabs tabs={FILTER_TABS} ariaLabel="消息分類" />
            <div className="inner-news-layout">
              {feature ? (
                <article className="inner-news-feature">
                  {/* Direct <img> child: `.inner-news-feature>img` is what
                      absolutely positions it as the full-bleed backdrop. Wrap it
                      and the card collapses to an inline image. */}
                  <img
                    src={feature.cover_url ?? FEATURE_FALLBACK_IMAGE}
                    alt={feature.cover_url ? feature.title : "農業綜合館中庭"}
                  />
                  {/* Also a direct <div> child, for the same reason. */}
                  <div>
                    <span>
                      FEATURED · {formatNewsDate(feature.published_at).full}
                    </span>
                    <h3>{feature.title}</h3>
                    <p>{feature.body ?? FEATURE_LEAD}</p>
                    {/* href="#" as on the reference site: neither site has a
                        single-post page. */}
                    <a href="#">閱讀完整消息 →</a>
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
            <nav className="pagination" aria-label="消息分頁">
              <span>01</span>
              <a href="#">02</a>
              <a href="#">03</a>
              <a href="#">下一頁 →</a>
            </nav>
          </div>
        </section>
      </div>
      <NextRoute />
    </SiteShell>
  );
}
