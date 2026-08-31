import Link from "next/link";
import type { NewsPage } from "@/lib/data";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { NEWS } from "@/lib/i18n/news";
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";
import { Pagination } from "./Pagination";
import { TalkList } from "./TalkList";

/**
 * 演講公告封存 (/news/talks, /news/talks/page/N).
 *
 * Why this page exists: the talks block on /news used to be every talk in the
 * table. That was right when the table held one; after the 428 announcements
 * were migrated from the old site it held 256, nine years deep, and /news
 * became 385KB of mostly-expired notices stacked below the fold. Talks are also
 * excluded from the main paginated list, so capping the block without somewhere
 * to put the rest would have made 246 announcements unreachable.
 *
 * The old site arranged them the same way — its 演講公告 list is thirteen pages
 * of its own — so this is the source's own IA rather than a new invention.
 *
 * Deliberately absent from lib/nav.ts, for the same reason /blog is: those
 * eight routes drive the "NN / 08" counter in every interior hero, and a ninth
 * would renumber the whole site. Readers arrive from the block on /news.
 * `InteriorHero.routeNo` is optional for exactly this case.
 */
export function Talks({ lang, talksPage }: { lang: Lang; talksPage: NewsPage }) {
  const t = translate(NEWS, lang);
  const { items, page, totalPages } = talksPage;

  return (
    <SiteShell lang={lang} variant="interior">
      <InteriorHero
        lang={lang}
        // Reuses the news hero image: the client's asset folder has one photo
        // per route and this page is part of 最新消息, not a ninth route.
        slug="news"
        titleZh={NEWS.talksArchiveTitle.zh}
        titleEn={NEWS.talksArchiveTitle.en}
        lead={t.talksArchiveLead}
        imageAlt={t.heroAlt}
      />

      {/* No LocalNav: that strip is a table of contents for a page with several
          sections, and this one is a single list. */}
      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            <SectionTitle
              no="01"
              eyebrow="TALKS & SEMINARS"
              heading={t.talksArchiveHeading}
              description={t.talksDescription}
            />
            <TalkList lang={lang} talks={items} />

            <p className="news-to-blog">
              <Link className="text-action" href={localizePath("/news", lang)}>
                {t.talksBackToNews}
              </Link>
            </p>
            <Pagination
              lang={lang}
              page={page}
              totalPages={totalPages}
              hrefFor={(n) =>
                localizePath(n === 1 ? "/news/talks" : `/news/talks/page/${n}`, lang)
              }
            />
          </div>
        </section>
      </div>

      <NextRoute lang={lang} />
    </SiteShell>
  );
}
