import Link from "next/link";
import type { Post } from "@/lib/data";
import { localizePath, translate, type Lang } from "@/lib/i18n";
import { BLOG, BLOG_TITLE } from "@/lib/i18n/blog";
import { EYEBROWS } from "@/lib/i18n/eyebrows";
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";
import { formatNewsDate } from "./format";

/**
 * 專欄文章 (/blog, /en/blog) — the public face of the posts table.
 *
 * Built out of the /news blocks rather than a new set: `.inner-news-feature`
 * wants a cover image, a kicker, a title, a standfirst and a link, and `posts`
 * is the one table that has all five (`news.body` is null on every row, which
 * is why the news feature card drops its standfirst). Reusing them also means
 * the legible-size lifts in site-extensions.css already cover this page.
 *
 * ⚠️ /blog is deliberately NOT in lib/nav.ts. The eight routes there are the
 * department's agreed IA and every interior hero prints "NN / 08"; a ninth
 * would renumber all of them. It is reached from the footer and from /news,
 * and `InteriorHero` is given no `routeNo` for the same reason.
 *
 * The hero photo is /news's. There is no blog-specific shot in the client's
 * asset folder — inventing one by cropping an unrelated photo would look worse
 * than sharing the editorially closest image. Swap `slug` when they supply one.
 */

/** Fallback cover for the feature card when the newest post has none. */
const FEATURE_FALLBACK_IMAGE = "/images/courtyard.jpg";

export function Blog({ lang, posts }: { lang: Lang; posts: Post[] }) {
  const t = translate(BLOG, lang);
  const eb = translate(EYEBROWS, lang);
  const [feature, ...rest] = posts;

  return (
    <SiteShell lang={lang} variant="interior">
      <InteriorHero
        lang={lang}
        slug="news"
        titleZh={BLOG_TITLE.zh}
        titleEn={BLOG_TITLE.en}
        lead={t.lead}
        imageAlt={t.heroAlt}
      />
      <LocalNav
        lang={lang}
        label={t.localNavLabel}
        items={[{ href: "#section-1", label: t.nav.latest }]}
      />
      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            <SectionTitle
              no="01"
              eyebrow={eb.writing}
              heading={t.listHeading}
              description={t.listDescription}
            />

            {feature ? (
              /* `.inner-news-layout` is a `.78fr 1.22fr` grid: the feature card
                 on the left, the list on the right. With a single published
                 post there is no list, and keeping the grid would leave 60% of
                 the row blank — so the wrapper is dropped and the card spans
                 the container instead. */
              <div
                className={rest.length > 0 ? "inner-news-layout" : undefined}
              >
                <article className="inner-news-feature">
                  {/* Direct <img> child: `.inner-news-feature>img` is what
                      absolutely positions it as the full-bleed backdrop. Wrap
                      it and the card collapses to an inline image. */}
                  <img
                    src={feature.cover_url ?? FEATURE_FALLBACK_IMAGE}
                    alt={feature.cover_url ? feature.title : t.heroAlt}
                  />
                  {/* Also a direct <div> child, for the same reason. */}
                  <div>
                    {/* Date keeps its YYYY.MM.DD form on both sites: it is set
                        as a Latin-caps run beside `FEATURED ·`, and a localised
                        "Jan 5, 2026" would break that alignment. */}
                    <span>
                      FEATURED · {formatNewsDate(feature.published_at).full}
                    </span>
                    <h3>{feature.title}</h3>
                    {feature.excerpt ? <p>{feature.excerpt}</p> : null}
                    <Link href={localizePath(`/blog/${feature.slug}`, lang)}>
                      {t.readMore}
                    </Link>
                  </div>
                </article>

                {/* `.inner-news-list>a` is a 4-column grid (date / tag / title
                    / arrow) that collapses to 3 at 600px by hiding the <span>.
                    No :nth-child rules, so the row count is free.

                    Omitted entirely when empty rather than rendered as a bare
                    container: `.inner-news-list` carries a `border-top`, which
                    with no rows under it is a stray hairline. */}
                {rest.length > 0 ? (
                  <div className="inner-news-list">
                    {rest.map((post) => (
                      <Link
                        href={localizePath(`/blog/${post.slug}`, lang)}
                        key={post.id}
                      >
                        <time dateTime={post.published_at.slice(0, 10)}>
                          {formatNewsDate(post.published_at).full}
                        </time>
                        {/* The first tag, not all of them: this cell is an 86px
                          column sized for one short label. Tags stay Chinese in
                          both languages — they are a matching key, not copy
                          (see Post.tags). */}
                        <span>{post.tags[0] ?? ""}</span>
                        <h3>{post.title}</h3>
                        <i>↗︎</i>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              /* Borrowed from /faculty's empty state: same muted serif line,
                 and it already clears the 12px floor. */
              <p className="faculty-empty">{t.empty}</p>
            )}
          </div>
        </section>
      </div>
      <NextRoute lang={lang} />
    </SiteShell>
  );
}
